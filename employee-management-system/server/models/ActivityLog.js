// models/ActivityLog.js
const mongoose = require('mongoose');

/**
 * ActivityLog schema records significant actions performed in the system.
 * action: one of CREATE, UPDATE, DELETE, VIEWED, LOGIN, LOGOUT
 * performedBy: reference to the User who performed the action
 * targetEmployee: optional reference to the Employee affected by the action
 * description: human‑readable summary of the event
 * ipAddress & userAgent capture request metadata for audit purposes
 * timestamp defaults to the time of creation
 */
const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['CREATED', 'UPDATED', 'DELETED', 'VIEWED', 'LOGIN', 'LOGOUT'],
      required: true,
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    description: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
