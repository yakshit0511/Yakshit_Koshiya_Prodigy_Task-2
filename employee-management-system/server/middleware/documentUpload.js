// server/middleware/documentUpload.js
const path = require('path');
const multer = require('multer');

// File filter – allow documents and images by MIME type
function fileFilter(req, file, cb) {
  const allowed = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPG, JPEG, PNG, PDF, DOC, DOCX, and TXT are allowed'), false);
  }
  cb(null, true);
}

const documentUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = documentUpload;
