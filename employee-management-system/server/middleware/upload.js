// Multer middleware for profile photo uploads
// Accepts jpg, jpeg, png files up to 2MB and stores them in /uploads

const multer = require('multer');

// File filter – only allow images by MIME type
function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Only image files (jpg, jpeg, png) are allowed'), false);
  }
  cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = upload;
