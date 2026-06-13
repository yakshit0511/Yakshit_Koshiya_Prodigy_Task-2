// controllers/activityLogController.js
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('express-async-handler');

// @desc    Get paginated activity logs
// @route   GET /api/activity-logs
// @access  Admin
const getActivityLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, action, startDate, endDate, userId } = req.query;
  const filter = {};
  if (action) filter.action = action;
  if (userId) filter.performedBy = userId;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const logs = await ActivityLog.find(filter)
    .populate('performedBy', 'firstName lastName email')
    .populate('targetEmployee', 'employeeId firstName lastName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await ActivityLog.countDocuments(filter);
  res.json({ total, page: parseInt(page), limit: parseInt(limit), logs });
});

module.exports = { getActivityLogs };
