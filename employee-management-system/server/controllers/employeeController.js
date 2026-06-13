// Employee Controller
// Handles all employee related API actions

const Employee = require('../models/Employee');
const ActivityLog = require('../models/ActivityLog');
const SalaryHistory = require('../models/SalaryHistory');
const { validationResult } = require('express-validator');
const NodeCache = require('node-cache');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const statsCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const uploadPath = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

/**
 * Helper to format API response
 */
const sendResponse = (res, status, success, data, message) => {
  return res.status(status).json({ success, data, message });
};

/**
 * GET /api/employees
 * Retrieve all employees with optional search, filter, pagination, sorting
 */
const getAllEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search = '',
      department,
      status,
    } = req.query;

    const query = {};

    // Text search on firstName, lastName, email, phone
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) query.department = department;
    if (status) query.status = status;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { [sort]: order === 'asc' ? 1 : -1 },
      lean: true,
      select: 'firstName lastName email phone department designation employmentType salary joiningDate status profilePhoto employeeId createdBy createdAt updatedAt',
      populate: { path: 'createdBy', select: 'name email' },
    };

    const result = await Employee.paginate(query, options);

    return sendResponse(res, 200, true, result, 'Employees retrieved');
  } catch (error) {
    console.error('Error getting employees:', error);
    return sendResponse(res, 500, false, null, 'Failed to fetch employees');
  }
};

/**
 * GET /api/employees/:id
 * Retrieve a single employee by MongoDB _id
 */
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id).populate('createdBy', 'name email');
    if (!employee) {
      return sendResponse(res, 404, false, null, 'Employee not found');
    }

    // Log Activity
    await ActivityLog.create({
      action: 'VIEWED',
      performedBy: req.user.id,
      targetEmployee: employee._id,
      description: `Viewed details of employee ${employee.firstName} ${employee.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return sendResponse(res, 200, true, employee, 'Employee fetched');
  } catch (error) {
    console.error('Error fetching employee:', error);
    return sendResponse(res, 500, false, null, 'Failed to fetch employee');
  }
};

/**
 * POST /api/employees
 * Create a new employee (admin only)
 */
const createEmployee = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, null, 'Validation failed');
    }

    const employeeData = { ...req.body, createdBy: req.user.id };
    const employee = new Employee(employeeData);
    await employee.save();

    // Log Activity
    await ActivityLog.create({
      action: 'CREATED',
      performedBy: req.user.id,
      targetEmployee: employee._id,
      description: `Created employee ${employee.firstName} ${employee.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Initial Salary History
    await SalaryHistory.create({
      employee: employee._id,
      previousSalary: 0,
      newSalary: employee.salary,
      changedBy: req.user.id,
      reason: 'Initial Salary on Creation'
    });

    return sendResponse(res, 201, true, employee, 'Employee created');
  } catch (error) {
    console.error('Error creating employee:', error);
    return sendResponse(res, 500, false, null, 'Failed to create employee');
  }
};

/**
 * PUT /api/employees/:id
 * Update employee details (admin only)
 */
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendResponse(res, 400, false, null, 'Validation failed');
    }

    const currentEmployee = await Employee.findById(id);
    if (!currentEmployee) {
      return sendResponse(res, 404, false, null, 'Employee not found');
    }

    const previousSalary = currentEmployee.salary;
    const newSalary = Number(req.body.salary);

    const updated = await Employee.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    // Log Activity
    await ActivityLog.create({
      action: 'UPDATED',
      performedBy: req.user.id,
      targetEmployee: updated._id,
      description: `Updated employee ${updated.firstName} ${updated.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Salary History if changed
    if (previousSalary !== newSalary) {
      await SalaryHistory.create({
        employee: updated._id,
        previousSalary,
        newSalary,
        changedBy: req.user.id,
        reason: 'Salary updated in profile edit'
      });
    }

    return sendResponse(res, 200, true, updated, 'Employee updated');
  } catch (error) {
    console.error('Error updating employee:', error);
    return sendResponse(res, 500, false, null, 'Failed to update employee');
  }
};

/**
 * DELETE /api/employees/:id
 * Soft delete – set status to Inactive (admin only)
 */
const softDeleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndUpdate(
      id,
      { status: 'Inactive' },
      { new: true }
    );
    if (!employee) {
      return sendResponse(res, 404, false, null, 'Employee not found');
    }

    // Log Activity
    await ActivityLog.create({
      action: 'DELETED',
      performedBy: req.user.id,
      targetEmployee: employee._id,
      description: `Soft deleted employee ${employee.firstName} ${employee.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return sendResponse(res, 200, true, employee, 'Employee marked as inactive');
  } catch (error) {
    console.error('Error soft deleting employee:', error);
    return sendResponse(res, 500, false, null, 'Failed to delete employee');
  }
};

/**
 * DELETE /api/employees/:id/permanent
 * Permanent delete from DB (admin only)
 */
const permanentDeleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);
    if (!employee) {
      return sendResponse(res, 404, false, null, 'Employee not found');
    }
    
    await Employee.findByIdAndDelete(id);

    // Log Activity
    await ActivityLog.create({
      action: 'DELETED',
      performedBy: req.user.id,
      description: `Permanently deleted employee ${employee.firstName} ${employee.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    return sendResponse(res, 200, true, null, 'Employee permanently removed');
  } catch (error) {
    console.error('Error permanently deleting employee:', error);
    return sendResponse(res, 500, false, null, 'Failed to permanently delete employee');
  }
};

/**
 * POST /api/employees/:id/photo
 * Upload profile photo (admin only)
 */
const uploadPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return sendResponse(res, 400, false, null, 'No file uploaded');
    }

    const { fileTypeFromBuffer } = await import('file-type');
    const detectedType = await fileTypeFromBuffer(req.file.buffer);
    if (!detectedType || !['jpg', 'jpeg', 'png'].includes(detectedType.ext)) {
      return sendResponse(res, 400, false, null, 'Invalid file type');
    }

    const fileName = `${randomUUID()}.${detectedType.ext === 'jpeg' ? 'jpg' : detectedType.ext}`;
    const filePath = path.join(uploadPath, fileName);
    await fs.promises.writeFile(filePath, req.file.buffer);

    const photoPath = `/uploads/${fileName}`;
    const employee = await Employee.findByIdAndUpdate(
      id,
      { profilePhoto: photoPath },
      { new: true }
    );
    if (!employee) {
      await fs.promises.unlink(filePath).catch(() => {});
      return sendResponse(res, 404, false, null, 'Employee not found');
    }
    return sendResponse(res, 200, true, employee, 'Profile photo uploaded');
  } catch (error) {
    console.error('Error uploading photo:', error);
    return sendResponse(res, 500, false, null, 'Failed to upload photo');
  }
};

/**
 * GET /api/employees/dashboard/stats
 * Returns aggregated statistics for dashboard UI
 */
const getDashboardStats = async (req, res) => {
  try {
    const cachedStats = statsCache.get('dashboardStats');
    if (cachedStats) {
      return sendResponse(res, 200, true, cachedStats, 'Dashboard statistics retrieved');
    }

    const [summary] = await Employee.aggregate([
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalEmployees: { $sum: 1 },
                activeEmployees: {
                  $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] },
                },
              },
            },
          ],
          departments: [
            { $group: { _id: '$department', count: { $sum: 1 } } },
          ],
          employmentTypes: [
            { $group: { _id: '$employmentType', count: { $sum: 1 } } },
          ],
          recentJoinees: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                firstName: 1,
                lastName: 1,
                email: 1,
                phone: 1,
                department: 1,
                designation: 1,
                employmentType: 1,
                salary: 1,
                joiningDate: 1,
                status: 1,
                createdAt: 1,
                employeeId: 1,
              },
            },
          ],
        },
      },
    ]);

    const total = summary?.totals?.[0]?.totalEmployees || 0;
    const active = summary?.totals?.[0]?.activeEmployees || 0;
    const deptCounts = {};
    (summary?.departments || []).forEach((d) => (deptCounts[d._id] = d.count));
    const typeCounts = {};
    (summary?.employmentTypes || []).forEach((t) => (typeCounts[t._id] = t.count));
    const recent = summary?.recentJoinees || [];

    const payload = {
      totalEmployees: total,
      activeEmployees: active,
      departmentWise: deptCounts,
      employmentTypeWise: typeCounts,
      recentJoinees: recent,
    };

    statsCache.set('dashboardStats', payload);

    return sendResponse(res, 200, true, payload,
    'Dashboard statistics retrieved');
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return sendResponse(res, 500, false, null, 'Failed to retrieve dashboard stats');
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  softDeleteEmployee,
  permanentDeleteEmployee,
  uploadPhoto,
  getDashboardStats,
};
