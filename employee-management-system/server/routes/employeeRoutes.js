// Employee Routes
// Defines API endpoints for employee management

const express = require('express');
const { body } = require('express-validator');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  softDeleteEmployee,
  permanentDeleteEmployee,
  uploadPhoto,
  getDashboardStats,
} = require('../controllers/employeeController');
const { getSalaryHistory, updateSalary } = require('../controllers/salaryHistoryController');
const { bulkDeleteEmployees, bulkStatusUpdate } = require('../controllers/bulkEmployeeController');
const { exportCsv, exportPdf } = require('../controllers/exportController');
const { uploadDocument, deleteDocument } = require('../controllers/documentController');
const { advancedSearch, getAdvancedStats } = require('../controllers/advancedController');

const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');
const documentUpload = require('../middleware/documentUpload');

const router = express.Router();

// Validation rules for employee creation / update
const employeeValidation = [
  body('firstName').notEmpty().withMessage('First name required'),
  body('lastName').notEmpty().withMessage('Last name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').matches(/^\+?[0-9]{7,15}$/).withMessage('Valid phone required'),
  body('department').notEmpty().withMessage('Department required'),
  body('designation').notEmpty().withMessage('Designation required'),
  body('employmentType').isIn(['Full-Time', 'Part-Time', 'Contract', 'Intern']).withMessage('Invalid employment type'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('joiningDate').isISO8601().toDate().withMessage('Valid joining date required'),
  body('status').isIn(['Active', 'Inactive', 'On Leave']).withMessage('Invalid status'),
];

// Dashboard / aggregate statistics
router.get('/dashboard/stats', protect, adminOnly, getDashboardStats);
router.get('/stats/advanced', protect, adminOnly, getAdvancedStats);

// Advanced search
router.get('/search/advanced', protect, adminOnly, advancedSearch);

// Exports
router.get('/export/csv', protect, adminOnly, exportCsv);
router.get('/export/pdf', protect, adminOnly, exportPdf);

// Bulk Operations
router.post('/bulk-delete', protect, adminOnly, bulkDeleteEmployees);
router.post('/bulk-status-update', protect, adminOnly, bulkStatusUpdate);

// Basic CRUD
router.get('/', protect, adminOnly, getAllEmployees);
router.get('/:id', protect, adminOnly, getEmployeeById);
router.post('/', protect, adminOnly, employeeValidation, createEmployee);
router.put('/:id', protect, adminOnly, employeeValidation, updateEmployee);
router.delete('/:id', protect, adminOnly, softDeleteEmployee);
router.delete('/:id/permanent', protect, adminOnly, permanentDeleteEmployee);
router.post('/:id/photo', protect, adminOnly, upload.single('photo'), uploadPhoto);

// Salary History
router.get('/:id/salary-history', protect, adminOnly, getSalaryHistory);
router.post('/:id/salary', protect, adminOnly, updateSalary);

// Documents
router.post('/:id/documents', protect, adminOnly, documentUpload.single('document'), uploadDocument);
router.delete('/:id/documents/:docId', protect, adminOnly, deleteDocument);

module.exports = router;

