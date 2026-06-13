// models/SalaryHistory.js
const mongoose = require('mongoose');

/**
 * SalaryHistory records every change to an employee's salary.
 * It stores the previous salary, the new salary, who made the change,
 * an optional reason and the timestamp of the change.
 */
const salaryHistorySchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    previousSalary: { type: Number, required: true },
    newSalary: { type: Number, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String },
    changedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalaryHistory', salaryHistorySchema);
