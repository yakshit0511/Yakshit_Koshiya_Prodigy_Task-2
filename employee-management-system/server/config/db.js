// MongoDB Atlas Database Connection Configuration
// This file handles all database connection logic for the MERN application

const mongoose = require("mongoose");

/**
 * Connect to MongoDB Atlas
 * This function establishes a connection to MongoDB Atlas cluster
 * using the connection string from environment variables
 */
const connectDB = async () => {
  try {
    // Retrieve MongoDB URI from environment variables
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error(
        "MONGO_URI is not defined in .env file. Please add your MongoDB Atlas connection string."
      );
    }

    // Connect to MongoDB Atlas
    const conn = await mongoose.connect(mongoURI);

    console.log(`✓ MongoDB Atlas connected successfully!`);
    console.log(`  Connected to: ${conn.connection.host}`);
    console.log(`  Database: ${conn.connection.name}`);

    return conn;
  } catch (error) {
    console.error("✗ MongoDB Connection Error:");
    console.error(`  ${error.message}`);
    process.exit(1); // Exit process on connection failure
  }
};

module.exports = connectDB;
