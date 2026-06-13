// controllers/exportController.js
const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('express-async-handler');
const PDFDocument = require('pdfkit');
const { createObjectCsvStringifier } = require('csv-writer');

// @desc    Export employee list as CSV
// @route   GET /api/employees/export/csv
// @access  Admin
const exportCsv = asyncHandler(async (req, res) => {
  const employees = await Employee.find({}).sort({ employeeId: 1 });

  const csvStringifier = createObjectCsvStringifier({
    header: [
      { id: 'employeeId', title: 'Employee ID' },
      { id: 'firstName', title: 'First Name' },
      { id: 'lastName', title: 'Last Name' },
      { id: 'email', title: 'Email' },
      { id: 'phone', title: 'Phone' },
      { id: 'department', title: 'Department' },
      { id: 'designation', title: 'Designation' },
      { id: 'employmentType', title: 'Employment Type' },
      { id: 'salary', title: 'Salary' },
      { id: 'joiningDate', title: 'Joining Date' },
      { id: 'status', title: 'Status' }
    ]
  });

  const records = employees.map(emp => ({
    employeeId: emp.employeeId,
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    phone: emp.phone,
    department: emp.department,
    designation: emp.designation,
    employmentType: emp.employmentType,
    salary: emp.salary,
    joiningDate: emp.joiningDate ? emp.joiningDate.toISOString().split('T')[0] : '',
    status: emp.status
  }));

  const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

  // Log activity
  await ActivityLog.create({
    action: 'VIEWED',
    performedBy: req.user.id,
    description: `Exported employee list as CSV (${employees.length} records)`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=employees.csv');
  res.status(200).send(csvContent);
});

// @desc    Export employee list as PDF
// @route   GET /api/employees/export/pdf
// @access  Admin
const exportPdf = asyncHandler(async (req, res) => {
  const employees = await Employee.find({}).sort({ employeeId: 1 });

  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  // Log activity
  await ActivityLog.create({
    action: 'VIEWED',
    performedBy: req.user.id,
    description: `Exported employee list as PDF (${employees.length} records)`,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=employees.pdf');
  doc.pipe(res);

  // PDF Header
  doc.fontSize(20).text('Enterprise Employee Management System', { align: 'center' });
  doc.fontSize(12).text('Complete Employee Directory', { align: 'center' });
  doc.moveDown();

  doc.fontSize(10).text(`Generated On: ${new Date().toLocaleString()}`, { align: 'right' });
  doc.text(`Total Records: ${employees.length}`, { align: 'right' });
  doc.moveDown();

  // Table header
  const tableTop = 150;
  doc.font('Helvetica-Bold');
  doc.fontSize(10);
  doc.text('ID', 30, tableTop);
  doc.text('Name', 80, tableTop);
  doc.text('Email', 180, tableTop);
  doc.text('Department', 320, tableTop);
  doc.text('Designation', 420, tableTop);
  doc.text('Status', 520, tableTop);

  doc.moveTo(30, tableTop + 15).lineTo(565, tableTop + 15).stroke();

  let y = tableTop + 25;
  doc.font('Helvetica');

  employees.forEach((emp) => {
    if (y > 750) {
      doc.addPage();
      y = 50; // top of new page
      doc.font('Helvetica-Bold');
      doc.text('ID', 30, y);
      doc.text('Name', 80, y);
      doc.text('Email', 180, y);
      doc.text('Department', 320, y);
      doc.text('Designation', 420, y);
      doc.text('Status', 520, y);
      doc.moveTo(30, y + 15).lineTo(565, y + 15).stroke();
      y += 25;
      doc.font('Helvetica');
    }

    doc.text(emp.employeeId || '', 30, y);
    doc.text(`${emp.firstName} ${emp.lastName}`, 80, y, { width: 95, lineBreak: false });
    doc.text(emp.email || '', 180, y, { width: 135, lineBreak: false });
    doc.text(emp.department || '', 320, y, { width: 95, lineBreak: false });
    doc.text(emp.designation || '', 420, y, { width: 95, lineBreak: false });
    doc.text(emp.status || '', 520, y);

    y += 20;
  });

  doc.end();
});

module.exports = { exportCsv, exportPdf };
