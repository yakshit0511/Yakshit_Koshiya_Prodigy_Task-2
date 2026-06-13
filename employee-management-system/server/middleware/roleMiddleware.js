// Role-Based Access Control Middleware
// Restricts routes based on user roles (admin, user, etc.)

/**
 * Role Authorization Middleware Factory
 * Returns middleware that checks if user has one of the allowed roles
 *
 * Usage: app.get("/admin", protect, authorize("admin"), controller)
 *        app.post("/delete", protect, authorize("admin", "moderator"), controller)
 *
 * @param {...String} allowedRoles - The roles that are allowed to access this route
 * @returns {Function} - Middleware function that checks user role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (protect middleware should run first)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required. Please log in first.",
        });
      }

      // Get the user's role from the decoded JWT token
      const userRole = req.user.role;

      // Check if user's role is in the allowed roles list
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This resource requires one of the following roles: ${allowedRoles.join(", ")}. Your current role is: ${userRole}`,
        });
      }

      // User has the required role, proceed to next middleware/controller
      next();
    } catch (error) {
      console.error("Authorization middleware error:", error);
      return res.status(500).json({
        success: false,
        message: "Authorization check failed",
        error: error.message,
      });
    }
  };
};

/**
 * Convenience middleware for admin-only routes
 * Usage: app.get("/admin-panel", protect, adminOnly, controller)
 */
const adminOnly = authorize("admin");

/**
 * Convenience middleware for user and admin routes
 * Usage: app.get("/profile", protect, userOrAdmin, controller)
 */
const userOrAdmin = authorize("user", "admin");

module.exports = { authorize, adminOnly, userOrAdmin };
