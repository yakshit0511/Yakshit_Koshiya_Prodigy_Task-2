// JWT Authentication Middleware
// Verifies JWT tokens and protects routes that require authentication

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user data to request
 *
 * Usage: app.use(protect) or app.get("/route", protect, controller)
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    // Expected format: "Bearer <token>"
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;

      // Check if authorization header starts with "Bearer"
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7); // Remove "Bearer " (7 characters)
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid authorization header format. Use: Bearer <token>",
        });
      }
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token provided. Please log in.",
      });
    }

    try {
      // Verify token signature and expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user from database (excluding password)
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User associated with token no longer exists",
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: "This account has been deactivated",
        });
      }

      // Attach decoded user data to request object
      // This makes it available to next middleware/controllers
      req.user = decoded;
      req.userData = user;

      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Your authentication token has expired. Please log in again.",
        });
      } else if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid or malformed authentication token",
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication verification failed",
      error: error.message,
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attempts to verify JWT but doesn't block if token is missing
 * Useful for routes that have different content based on auth status
 */
const protectOptional = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.slice(7);

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (user && user.isActive) {
          req.user = decoded;
          req.userData = user;
        }
      } catch (error) {
        // Silently fail - no token or invalid token is ok for optional auth
        console.log("Optional auth failed, continuing without user context");
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next(); // Continue anyway
  }
};

module.exports = { protect, protectOptional };
