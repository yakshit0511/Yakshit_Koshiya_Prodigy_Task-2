// Authentication Routes
// Defines all authentication-related API endpoints

const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  refreshToken,
  changePassword,
  getMe,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user account
 * No authentication required
 *
 * Validation Rules:
 * - name: required, string, min 2 chars, max 50 chars
 * - email: required, valid email format
 * - password: required, min 6 characters
 */
router.post(
  "/register",
  authLimiter,
  [
    // Name validation
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),

    // Email validation
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(), // Convert to lowercase

    // Password validation
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .custom((value) => {
        if (value.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
          throw new Error('Password must include uppercase, lowercase, number, and special character');
        }
        return true;
      }),
  ],
  register
);

/**
 * POST /api/auth/login
 * Authenticate a user and return JWT token
 * No authentication required
 *
 * Validation Rules:
 * - email: required, valid email format
 * - password: required, non-empty
 */
router.post(
  "/login",
  authLimiter,
  [
    // Email validation
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email address")
      .normalizeEmail(),

    // Password validation
    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  login
);

router.post('/refresh-token', refreshToken);

router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .custom((value) => {
        if (value.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/[0-9]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
          throw new Error('Password must include uppercase, lowercase, number, and special character');
        }
        return true;
      }),
  ],
  changePassword
);

/**
 * GET /api/auth/me
 * Get currently authenticated user's profile
 * Authentication required: Bearer token in Authorization header
 */
router.get("/me", protect, getMe);

/**
 * GET /api/auth/logout
 * Logout the current user
 * Authentication required: Bearer token in Authorization header
 * Note: With JWT, logout is primarily client-side (remove token from storage)
 */
router.post('/logout', logout);
router.get('/logout', logout);

module.exports = router;
