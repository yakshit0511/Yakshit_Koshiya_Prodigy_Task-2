// server/routes/activityLogRoutes.js
const express = require('express');
const { getActivityLogs } = require('../controllers/activityLogController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', protect, adminOnly, getActivityLogs);

module.exports = router;
