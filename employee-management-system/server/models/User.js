// User Schema for MongoDB
// Defines the structure for user documents stored in MongoDB Atlas

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Schema
 * Stores user account information with secure password hashing
 */
const userSchema = new mongoose.Schema(
  {
    // User's full name (required field)
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    // User's email (required, unique, case-insensitive)
    email: {
      type: String,
      required: [true, "Please provide an email address"],
      unique: true,
      lowercase: true,
      match: [
        /^\\w+([\\.-]?\\w+)*@\\w+([\\.-]?\\w+)*(\\.\\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },

    // User's password (hashed using bcryptjs, never stored in plain text)
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Don't return password by default in queries
    },

    // User's role for role-based access control
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    // Whether the account is active (for soft deletes)
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

/**
 * Pre-save middleware to hash password before storing
 * This ensures passwords are never stored in plain text
 */
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt for hashing (10 rounds for security)
    const salt = await bcrypt.genSalt(10);

    // Hash the password with the generated salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare plain text password with hashed password
 * Used during login to verify the user's password
 *
 * @param {String} enteredPassword - The plain text password entered by user
 * @returns {Promise<Boolean>} - Returns true if passwords match, false otherwise
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Method to get user data without sensitive information
 * Used when returning user data in API responses
 *
 * @returns {Object} - User object without password
 */
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; // Remove password from response
  return user;
};

// Create and export the User model
module.exports = mongoose.model("User", userSchema);
