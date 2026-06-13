// server/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const hpp = require('hpp');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const seedDemoData = require('./utils/seedDemoData');
const requestId = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const fileAccess = require('./middleware/fileAccess');

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

// Initialize Express app
const app = express();

// Middleware
app.use(requestId);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
      'img-src': ["'self'", 'data:', 'blob:'],
      'connect-src': ["'self'", ...allowedOrigins],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());
app.use(cookieParser());
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(new Error(`CORS blocked for origin ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Remove any MongoDB operator keys (keys starting with '$' or containing '.')
const sanitizeMongoOperators = (input) => {
  if (!input || typeof input !== 'object') return;
  Object.keys(input).forEach((key) => {
    try {
      if (key.startsWith('$') || key.indexOf('.') !== -1) {
        delete input[key];
      } else if (typeof input[key] === 'object' && input[key] !== null) {
        sanitizeMongoOperators(input[key]);
      }
    } catch (e) {
      // ignore
    }
  });
};

const sanitizeObjectStrings = (input) => {
  if (!input || typeof input !== 'object') return;
  Object.keys(input).forEach((key) => {
    const value = input[key];
    if (typeof value === 'string') {
      input[key] = value.replace(/[<>]/g, '');
    } else if (typeof value === 'object' && value !== null) {
      sanitizeObjectStrings(value);
    }
  });
};

app.use((req, res, next) => {
  sanitizeObjectStrings(req.body);
  sanitizeObjectStrings(req.query);
  sanitizeObjectStrings(req.params);

  sanitizeMongoOperators(req.body);
  sanitizeMongoOperators(req.query);
  sanitizeMongoOperators(req.params);
  next();
});
app.use(hpp());

// Serve uploaded files for authenticated users only.
app.use('/uploads', fileAccess, express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/activity-logs', activityLogRoutes);

// Connect to MongoDB
connectDB()
  .then(seedDemoData)
  .catch((error) => {
    console.error('Database initialization failed:', error);
  });

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
    requestId: req.requestId,
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
