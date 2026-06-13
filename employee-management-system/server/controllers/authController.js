// server/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const ActivityLog = require('../models/ActivityLog');
const { validationResult } = require('express-validator');
const {
  blacklistRefreshToken,
  isRefreshTokenBlacklisted,
} = require('../utils/tokenStore');

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || ACCESS_TOKEN_SECRET;
const ACCESS_TOKEN_EXPIRES = process.env.JWT_ACCESS_EXPIRE || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.JWT_REFRESH_EXPIRE || '7d';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 30 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/api/auth',
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES,
  });

const attachRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, cookieOptions);
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', cookieOptions);
};

const logActivity = async (payload) => {
  try {
    await ActivityLog.create(payload);
  } catch (error) {
    console.error('Activity log error:', error.message);
  }
};

const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: role || 'user',
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    attachRefreshCookie(res, refreshToken);

    await logActivity({
      action: 'CREATED',
      performedBy: user._id,
      description: `User registered: ${user.name} (${user.email})`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.status(201).json({
      success: true,
      token: accessToken,
      accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password +failedLoginAttempts +lockUntil'
    );

    if (!user) {
      console.warn(`Failed login attempt for unknown email: ${normalizedEmail} from ${req.ip}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: 'Account is locked due to too many failed login attempts. Please try again later.',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        user.failedLoginAttempts = 0;
      }
      await user.save({ validateBeforeSave: false });

      await logActivity({
        action: 'LOGIN',
        performedBy: user._id,
        description: `Failed login attempt for ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save({ validateBeforeSave: false });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    attachRefreshCookie(res, refreshToken);

    await logActivity({
      action: 'LOGIN',
      performedBy: user._id,
      description: `User logged in: ${user.name} (${user.email})`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.json({
      success: true,
      token: accessToken,
      accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided' });
    }

    if (isRefreshTokenBlacklisted(token)) {
      return res.status(401).json({ success: false, message: 'Token has been revoked' });
    }

    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken(user);
    return res.json({
      success: true,
      token: accessToken,
      accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    await logActivity({
      action: 'UPDATED',
      performedBy: user._id,
      description: `Password changed for ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      blacklistRefreshToken(refreshToken);
    }

    clearRefreshCookie(res);

    if (req.user?.id) {
      await logActivity({
        action: 'LOGOUT',
        performedBy: req.user.id,
        description: 'User logged out',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  changePassword,
  getMe,
  logout,
};
