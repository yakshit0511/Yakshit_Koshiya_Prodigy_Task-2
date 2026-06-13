const Employee = require('../models/Employee');
const User = require('../models/User');
const SalaryHistory = require('../models/SalaryHistory');
const ActivityLog = require('../models/ActivityLog');

const demoEmployees = [
  {
    firstName: 'Aarav',
    lastName: 'Shah',
    email: 'aarav.shah@example.com',
    phone: '+919876543210',
    department: 'Engineering',
    designation: 'Frontend Developer',
    employmentType: 'Full-Time',
    salary: 72000,
    joiningDate: '2024-01-15',
    status: 'Active',
    address: {
      street: '12 Riverfront Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380015',
    },
  },
  {
    firstName: 'Meera',
    lastName: 'Patel',
    email: 'meera.patel@example.com',
    phone: '+919812345678',
    department: 'HR',
    designation: 'HR Manager',
    employmentType: 'Full-Time',
    salary: 68000,
    joiningDate: '2023-10-01',
    status: 'Active',
    address: {
      street: '45 Corporate Park',
      city: 'Surat',
      state: 'Gujarat',
      pincode: '395007',
    },
  },
  {
    firstName: 'Kabir',
    lastName: 'Mehta',
    email: 'kabir.mehta@example.com',
    phone: '+919833221144',
    department: 'Sales',
    designation: 'Sales Executive',
    employmentType: 'Contract',
    salary: 54000,
    joiningDate: '2024-04-10',
    status: 'On Leave',
    address: {
      street: '88 Market Street',
      city: 'Vadodara',
      state: 'Gujarat',
      pincode: '390020',
    },
  },
  {
    firstName: 'Priya',
    lastName: 'Nair',
    email: 'priya.nair@example.com',
    phone: '+919844556677',
    department: 'Finance',
    designation: 'Accounts Analyst',
    employmentType: 'Part-Time',
    salary: 46000,
    joiningDate: '2024-06-20',
    status: 'Active',
    address: {
      street: '9 Lake View Lane',
      city: 'Rajkot',
      state: 'Gujarat',
      pincode: '360001',
    },
  },
  {
    firstName: 'Rohan',
    lastName: 'Iyer',
    email: 'rohan.iyer@example.com',
    phone: '+919855667788',
    department: 'Operations',
    designation: 'Operations Associate',
    employmentType: 'Intern',
    salary: 30000,
    joiningDate: '2025-01-05',
    status: 'Inactive',
    address: {
      street: '22 Sunrise Avenue',
      city: 'Gandhinagar',
      state: 'Gujarat',
      pincode: '382010',
    },
  },
];

const seedDemoData = async () => {
  const existingEmployeeCount = await Employee.countDocuments();
  if (existingEmployeeCount > 0) {
    console.log('Demo seed skipped: employee records already exist');
    return;
  }

  const creator = await User.findOne().sort({ createdAt: 1 });
  if (!creator) {
    console.log('Demo seed skipped: no user found to assign createdBy');
    return;
  }

  for (const employeeData of demoEmployees) {
    const employee = await Employee.create({
      ...employeeData,
      joiningDate: new Date(employeeData.joiningDate),
      createdBy: creator._id,
    });

    await SalaryHistory.create({
      employee: employee._id,
      previousSalary: 0,
      newSalary: employee.salary,
      changedBy: creator._id,
      reason: 'Initial demo seed data',
    });

    await ActivityLog.create({
      action: 'CREATED',
      performedBy: creator._id,
      targetEmployee: employee._id,
      description: `Seeded demo employee ${employee.firstName} ${employee.lastName}`,
      ipAddress: '127.0.0.1',
      userAgent: 'seed-script',
    });
  }

  console.log(`Seeded ${demoEmployees.length} demo employees`);
};

module.exports = seedDemoData;