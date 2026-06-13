// Employee Schema for Employee Management System
// Defines the structure for employee documents stored in MongoDB Atlas

const mongoose = require('mongoose');

/**
 * Employee Schema
 * Includes personal, job, and administrative fields.
 */
const employeeSchema = new mongoose.Schema(
  {
    seq: {
      type: Number,
      unique: true,
      sparse: true,
    },
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

const mongoosePaginate = require('mongoose-paginate-v2');
employeeSchema.plugin(mongoosePaginate);

employeeSchema.index({ email: 1 }, { unique: true });
employeeSchema.index({ employeeId: 1 }, { unique: true });
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ createdAt: -1 });
employeeSchema.index({ firstName: 1, lastName: 1 });

// Before saving, assign the next sequential employee ID if not present
employeeSchema.pre('save', async function () {
  if (this.employeeId) {
    return;
  }

  const lastEmployee = await this.constructor.findOne({}, { seq: 1 })
    .sort({ seq: -1 })
    .lean();

  const nextSeq = (lastEmployee?.seq || 0) + 1;
  this.seq = nextSeq;
  this.employeeId = `EMP-${String(nextSeq).padStart(3, '0')}`;
});

module.exports = mongoose.model('Employee', employeeSchema);

