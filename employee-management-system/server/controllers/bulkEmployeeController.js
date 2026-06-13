// controllers/bulkEmployeeController.js
const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('express-async-handler');

// @desc    Bulk delete employees
// @route   POST /api/employees/bulk-delete
// @access  Admin
const bulkDeleteEmployees = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide an array of employee IDs' });
  }

  // Find employees to log names
  const employees = await Employee.find({ _id: { $in: ids } });
  const names = employees.map(e => `${e.firstName} ${e.lastName}`).join(', ');

  const result = await Employee.deleteMany({ _id: { $in: ids } });

  // Log activity
  await ActivityLog.create({
    action: 'DELETED',
    performedBy: req.user.id,
    description: `Bulk deleted ${result.deletedCount} employees: ${names}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({ success: true, message: `Successfully deleted ${result.deletedCount} employees`, count: result.deletedCount });
});

// @desc    Bulk status update
// @route   POST /api/employees/bulk-status-update
// @access  Admin
const bulkStatusUpdate = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Please provide an array of employee IDs' });
  }
  if (!['Active', 'Inactive', 'On Leave'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const result = await Employee.updateMany(
    { _id: { $in: ids } },
    { $set: { status } }
  );

  // Log activity
  await ActivityLog.create({
    action: 'UPDATED',
    performedBy: req.user.id,
    description: `Bulk updated status to ${status} for ${result.modifiedCount} employees`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({ success: true, message: `Successfully updated status for ${result.modifiedCount} employees`, count: result.modifiedCount });
});

module.exports = { bulkDeleteEmployees, bulkStatusUpdate };
