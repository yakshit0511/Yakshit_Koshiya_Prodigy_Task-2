// Employee Routes
// Defines API endpoints for employee management

const express = require('express');
const { body, param } = require('express-validator');
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
const { employeeLimiter, uploadLimiter } = require('../middleware/rateLimiters');
const validateRequest = require('../middleware/validateRequest');
const upload = require('../middleware/upload');
const documentUpload = require('../middleware/documentUpload');

const router = express.Router();

// Validation rules for employee creation / update
const employeeValidation = [
  body('firstName').trim().matches(/^[A-Za-z ]+$/).withMessage('First name must contain only letters and spaces'),
  body('lastName').trim().matches(/^[A-Za-z ]+$/).withMessage('Last name must contain only letters and spaces'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Phone must be exactly 10 digits'),
  body('department').isIn(['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations', 'Design', 'Legal']).withMessage('Department required'),
  body('designation').trim().isLength({ min: 2, max: 100 }).withMessage('Designation is required'),
  body('employmentType').isIn(['Full-Time', 'Part-Time', 'Contract', 'Intern']).withMessage('Invalid employment type'),
  body('salary').isFloat({ min: 0, max: 100000000 }).withMessage('Salary must be a positive number up to 10 crore'),
  body('joiningDate').custom((value) => {
    const joiningDate = new Date(value);
    if (Number.isNaN(joiningDate.getTime())) {
      throw new Error('Valid joining date required');
    }
    const maxAllowed = new Date();
    maxAllowed.setFullYear(maxAllowed.getFullYear() + 1);
    if (joiningDate > maxAllowed) {
      throw new Error('Joining date cannot be more than 1 year in the future');
    }
    return true;
  }),
  body('status').isIn(['Active', 'Inactive', 'On Leave']).withMessage('Invalid status'),
  body('address.pincode').optional().matches(/^[0-9]{6}$/).withMessage('Pincode must be exactly 6 digits'),
];

// Dashboard / aggregate statistics
router.get('/dashboard/stats', protect, adminOnly, employeeLimiter, getDashboardStats);
router.get('/stats/advanced', protect, adminOnly, employeeLimiter, getAdvancedStats);

// Advanced search
router.get('/search/advanced', protect, adminOnly, employeeLimiter, advancedSearch);

// Exports
router.get('/export/csv', protect, adminOnly, employeeLimiter, exportCsv);
router.get('/export/pdf', protect, adminOnly, employeeLimiter, exportPdf);

// Bulk Operations
router.post('/bulk-delete', protect, adminOnly, employeeLimiter, bulkDeleteEmployees);
router.post('/bulk-status-update', protect, adminOnly, employeeLimiter, bulkStatusUpdate);

// Basic CRUD
router.get('/', protect, adminOnly, employeeLimiter, getAllEmployees);
router.get('/:id', protect, adminOnly, employeeLimiter, param('id').isMongoId().withMessage('Invalid ID format'), validateRequest, getEmployeeById);
router.post('/', protect, adminOnly, employeeLimiter, employeeValidation, createEmployee);
router.put('/:id', protect, adminOnly, employeeLimiter, param('id').isMongoId().withMessage('Invalid ID format'), validateRequest, employeeValidation, updateEmployee);
router.delete('/:id', protect, adminOnly, employeeLimiter, param('id').isMongoId().withMessage('Invalid ID format'), validateRequest, softDeleteEmployee);
router.delete('/:id/permanent', protect, adminOnly, employeeLimiter, param('id').isMongoId().withMessage('Invalid ID format'), validateRequest, permanentDeleteEmployee);
router.post('/:id/photo', protect, adminOnly, uploadLimiter, param('id').isMongoId().withMessage('Invalid ID format'), validateRequest, upload.single('photo'), uploadPhoto);

// Salary History
router.get('/:id/salary-history', protect, adminOnly, employeeLimiter, param('id').isMongoId().withMessage('Invalid ID format'), validateRequest, getSalaryHistory);
router.post('/:id/salary', protect, adminOnly, employeeLimiter, param('id').isMongoId().withMessage('Invalid ID format'), validateRequest, updateSalary);

// Documents
router.post('/:id/documents', protect, adminOnly, uploadLimiter, param('id').isMongoId().withMessage('Invalid ID format'), validateRequest, documentUpload.single('document'), uploadDocument);
router.delete('/:id/documents/:docId', protect, adminOnly, employeeLimiter, param('id').isMongoId().withMessage('Invalid ID format'), param('docId').isMongoId().withMessage('Invalid ID format'), validateRequest, deleteDocument);

module.exports = router;

