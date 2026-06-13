// controllers/documentController.js
const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');

// @desc    Upload document for an employee
// @route   POST /api/employees/:id/documents
// @access  Admin
const uploadDocument = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const employee = await Employee.findById(id);
  if (!employee) {
    // Delete uploaded file if employee is not found
    fs.unlinkSync(req.file.path);
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const docUrl = `/uploads/${req.file.filename}`;
  const newDoc = {
    name: name || req.file.originalname,
    fileUrl: docUrl,
    uploadedBy: req.user.id
  };

  employee.documents.push(newDoc);
  await employee.save();

  // Log activity
  await ActivityLog.create({
    action: 'UPDATED',
    performedBy: req.user.id,
    targetEmployee: id,
    description: `Uploaded document "${newDoc.name}" for employee ${employee.firstName} ${employee.lastName}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({ success: true, data: employee.documents, message: 'Document uploaded successfully' });
});

// @desc    Delete document for an employee
// @route   DELETE /api/employees/:id/documents/:docId
// @access  Admin
const deleteDocument = asyncHandler(async (req, res) => {
  const { id, docId } = req.params;

  const employee = await Employee.findById(id);
  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  const docIndex = employee.documents.findIndex(d => d._id.toString() === docId);
  if (docIndex === -1) {
    return res.status(404).json({ success: false, message: 'Document not found' });
  }

  const doc = employee.documents[docIndex];
  const filePath = path.join(__dirname, '..', doc.fileUrl);

  // Remove file from disk
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  const docName = doc.name;
  employee.documents.splice(docIndex, 1);
  await employee.save();

  // Log activity
  await ActivityLog.create({
    action: 'UPDATED',
    performedBy: req.user.id,
    targetEmployee: id,
    description: `Deleted document "${docName}" for employee ${employee.firstName} ${employee.lastName}`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(200).json({ success: true, data: employee.documents, message: 'Document deleted successfully' });
});

module.exports = { uploadDocument, deleteDocument };
