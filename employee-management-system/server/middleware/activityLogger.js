// middleware/activityLogger.js
const ActivityLog = require('../models/ActivityLog');

// Helper to create log entry
const logAction = async (req, action, description) => {
  try {
    const performedBy = req.user ? req.user.id : null; // set by protect middleware
    const targetEmployee = req.params.id || null;
    await ActivityLog.create({
      action,
      performedBy,
      targetEmployee,
      description,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (err) {
    console.error('Activity logger error:', err);
  }
};

// Middleware wrapper to log after response
const activityLogger = (action, descriptionGenerator) => {
  return async (req, res, next) => {
    // Run the next middleware/handler first
    await next();
    const description = typeof descriptionGenerator === 'function' ? descriptionGenerator(req, res) : descriptionGenerator;
    await logAction(req, action, description);
  };
};

module.exports = activityLogger;
