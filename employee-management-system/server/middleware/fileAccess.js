const jwt = require('jsonwebtoken');
const User = require('../models/User');

const fileAccess = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'Unauthorized file access' });
      }

      req.user = decoded;
      req.userData = user;
      return next();
    }

    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
      const user = await User.findById(decoded.id).select('-password');

      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'Unauthorized file access' });
      }

      req.user = decoded;
      req.userData = user;
      return next();
    }

    return res.status(401).json({ success: false, message: 'Authentication required for file access' });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Authentication required for file access' });
  }
};

module.exports = fileAccess;