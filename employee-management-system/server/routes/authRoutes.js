// Authentication Routes
// Defines all authentication-related API endpoints

const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  getMe,
  logout,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

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
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
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
router.get("/logout", protect, logout);

module.exports = router;
