// Multer middleware for profile photo uploads
// Accepts jpg, jpeg, png files up to 2MB and stores them in /uploads

const path = require('path');
const multer = require('multer');

// Destination folder (ensure it exists)
const uploadPath = path.join(__dirname, '..', 'uploads');

// Multer storage configuration – keep original filename with timestamp to avoid clashes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const timestamp = Date.now();
    const safeName = file.fieldname + '-' + timestamp + ext;
    cb(null, safeName);
  },
});

// File filter – only allow images
function fileFilter(req, file, cb) {
  const allowed = /\.(jpg|jpeg|png)$/i;
  if (!allowed.test(file.originalname)) {
    return cb(new Error('Only image files (jpg, jpeg, png) are allowed'), false);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

module.exports = upload;
