// controllers/salaryHistoryController.js
const SalaryHistory = require('../models/SalaryHistory');
const Employee = require('../models/Employee');
const asyncHandler = require('express-async-handler');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get salary history for an employee
// @route   GET /api/employees/:id/salary-history
// @access  Admin
const getSalaryHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const history = await SalaryHistory.find({ employee: id })
    .populate('changedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: history });
});

// @desc    Update employee salary and log to history
// @route   POST /api/employees/:id/salary
// @access  Admin
const updateSalary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newSalary, reason } = req.body;

  if (newSalary === undefined || newSalary < 0) {
    return res.status(400).json({ success: false, message: 'Valid new salary is required' });
  }

  const employee = await Employee.findById(id);
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const previousSalary = employee.salary;
  employee.salary = newSalary;
  await employee.save();

  // Create salary history entry
  const salaryEntry = await SalaryHistory.create({
    employee: id,
    previousSalary,
    newSalary,
    changedBy: req.user.id,
    reason: reason || 'Salary Update'
  });

  // Log activity
  await ActivityLog.create({
    action: 'UPDATED',
    performedBy: req.user.id,
    targetEmployee: id,
    description: `Updated salary for ${employee.firstName} ${employee.lastName} from ${previousSalary} to ${newSalary}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.json({ success: true, data: salaryEntry, employee });
});

module.exports = { getSalaryHistory, updateSalary };
