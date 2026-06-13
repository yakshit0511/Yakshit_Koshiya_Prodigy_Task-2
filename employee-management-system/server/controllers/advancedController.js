// controllers/advancedController.js
const Employee = require('../models/Employee');
const asyncHandler = require('express-async-handler');

// @desc    Advanced search for employees
// @route   GET /api/employees/search/advanced
// @access  Admin
const advancedSearch = asyncHandler(async (req, res) => {
  const {
    search = '',
    departments,
    statuses,
    employmentTypes,
    minSalary,
    maxSalary,
    startDate,
    endDate,
    page = 1,
    limit = 10
  } = req.query;

  const query = {};

  // Text search on name, email, phone, designation
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { designation: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter arrays
  if (departments) {
    const deptArray = Array.isArray(departments) ? departments : departments.split(',');
    if (deptArray.length > 0) query.department = { $in: deptArray };
  }

  if (statuses) {
    const statusArray = Array.isArray(statuses) ? statuses : statuses.split(',');
    if (statusArray.length > 0) query.status = { $in: statusArray };
  }

  if (employmentTypes) {
    const typeArray = Array.isArray(employmentTypes) ? employmentTypes : employmentTypes.split(',');
    if (typeArray.length > 0) query.employmentType = { $in: typeArray };
  }

  // Salary range
  if (minSalary || maxSalary) {
    query.salary = {};
    if (minSalary) query.salary.$gte = Number(minSalary);
    if (maxSalary) query.salary.$lte = Number(maxSalary);
  }

  // Joining date range
  if (startDate || endDate) {
    query.joiningDate = {};
    if (startDate) query.joiningDate.$gte = new Date(startDate);
    if (endDate) query.joiningDate.$lte = new Date(endDate);
  }

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { employeeId: 1 },
    lean: true
  };

  const result = await Employee.paginate(query, options);
  res.json({ success: true, data: result });
});

// @desc    Advanced statistics for dashboard
// @route   GET /api/employees/stats/advanced
// @access  Admin
const getAdvancedStats = asyncHandler(async (req, res) => {
  // 1. Avg salary and highest paid employee per department
  const deptStats = await Employee.aggregate([
    {
      $group: {
        _id: '$department',
        avgSalary: { $avg: '$salary' },
        maxSalary: { $max: '$salary' },
        count: { $sum: 1 }
      }
    }
  ]);

  // 2. Headcount monthly growth last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const monthlyHires = await Employee.aggregate([
    {
      $match: {
        joiningDate: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$joiningDate' },
          month: { $month: '$joiningDate' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // 3. Average tenure in months
  const tenureStats = await Employee.aggregate([
    {
      $project: {
        tenureDays: {
          $divide: [
            { $subtract: [new Date(), '$joiningDate'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgTenureDays: { $avg: '$tenureDays' }
      }
    }
  ]);

  const avgTenure = tenureStats.length > 0 ? Math.round(tenureStats[0].avgTenureDays / 30.4) : 0; // average months

  // 4. Status breakdown
  const statusStats = await Employee.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      deptStats,
      monthlyHires,
      avgTenureMonths: avgTenure,
      statusStats
    }
  });
});

module.exports = { advancedSearch, getAdvancedStats };
