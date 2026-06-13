// Employee Schema for Employee Management System
// Defines the structure for employee documents stored in MongoDB Atlas

const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose); // for sequential employee IDs

/**
 * Employee Schema
 * Includes personal, job, and administrative fields.
 */
const employeeSchema = new mongoose.Schema(
  {
    // Auto‑generated employee identifier: EMP‑001, EMP‑002, ...
    employeeId: {
      type: String,
      unique: true,
    },
    firstName: { type: String, required: [true, 'First name is required'], trim: true },
    lastName: { type: String, required: [true, 'Last name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[0-9]{7,15}$/, 'Please provide a valid phone number'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations', 'Design', 'Legal'],
    },
    designation: { type: String, required: [true, 'Designation is required'] },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern'],
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary must be a positive number'],
    },
    joiningDate: { type: Date, required: [true, 'Joining date is required'] },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['Active', 'Inactive', 'On Leave'],
      default: 'Active',
    },
    profilePhoto: { type: String }, // path to uploaded file
    // Array of uploaded documents (name, URL, upload metadata)
    documents: [{
      name: { type: String, required: true },
      fileUrl: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Auto‑increment numeric field to generate employeeId like EMP-001
employeeSchema.plugin(AutoIncrement, {
  inc_field: 'seq', // internal sequential number
  start_seq: 1,
});

const mongoosePaginate = require('mongoose-paginate-v2');
employeeSchema.plugin(mongoosePaginate);

// Before saving, set the formatted employeeId if not present
employeeSchema.pre('save', function (next) {
  if (!this.employeeId) {
    const padded = String(this.seq).padStart(3, '0');
    this.employeeId = `EMP-${padded}`;
  }
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);

