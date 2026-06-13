// server/middleware/documentUpload.js
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Destination folder (ensure it exists)
const uploadPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const safeName = 'doc-' + timestamp + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, safeName);
  },
});

// File filter – allow documents and images
function fileFilter(req, file, cb) {
  const allowed = /\.(jpg|jpeg|png|pdf|doc|docx|txt)$/i;
  if (!allowed.test(file.originalname)) {
    return cb(new Error('Invalid file type. Only JPG, JPEG, PNG, PDF, DOC, DOCX, and TXT are allowed'), false);
  }
  cb(null, true);
}

const documentUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = documentUpload;
