// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sanitize = require('sanitize-filename');

// ✅ CRITICAL: Use capital U to match server.js
const BASE_UPLOAD_DIR = path.join(__dirname, '..', 'Uploads');

// Ensure upload folder exists
function ensureDir(folder) {
  const dir = path.join(BASE_UPLOAD_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  console.log(`📁 Ensuring directory: ${dir}`); // Debug log
  return dir;
}

// Create Multer upload middleware
function createUpload(folder, options = {}) {
  if (!folder || typeof folder !== 'string') {
    throw new Error('Invalid upload folder');
  }

  const uploadDir = ensureDir(folder);

  // Multer storage configuration
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      console.log(`📤 Uploading to: ${uploadDir}`); // Debug log
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const safeName = sanitize(file.originalname);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = uniqueSuffix + path.extname(safeName);
      console.log(`📝 Saving file as: ${filename}`); // Debug log
      cb(null, filename);
    },
  });

  // File filter
  const fileFilter = function (req, file, cb) {
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG, WEBP are allowed.'));
    }
  };

  // Limits
  const limits = {};
  if (options.fileSizeMB) {
    limits.fileSize = options.fileSizeMB * 1024 * 1024;
  }

  return multer({ storage, fileFilter, limits });
}

module.exports = createUpload;