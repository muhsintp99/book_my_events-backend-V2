
// // middlewares/upload.js
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const sanitize = require('sanitize-filename');

// // Base upload directory
// const BASE_UPLOAD_DIR = path.join(__dirname, '..', 'Uploads');

// // Ensure upload folder exists
// function ensureDir(folder) {
//   const dir = path.join(BASE_UPLOAD_DIR, folder);
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
//   return dir;
// }

// // Create Multer upload middleware
// function createUpload(folder, options = {}) {
//   if (!folder || typeof folder !== 'string') {
//     throw new Error('Invalid upload folder');
//   }

//   const uploadDir = ensureDir(folder);

//   // Multer storage configuration
//   const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, uploadDir);
//     },
//     filename: function (req, file, cb) {
//       const safeName = sanitize(file.originalname);
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//       cb(null, uniqueSuffix + path.extname(safeName));
//     },
//   });

//   // File filter
//   const fileFilter = function (req, file, cb) {
//     const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/jpg'];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error('Invalid file type. Only JPEG, JPG, PNG are allowed.'));
//     }
//   };

//   // Limits
//   const limits = {};
//   if (options.fileSizeMB) {
//     limits.fileSize = options.fileSizeMB * 1024 * 1024; // Convert MB to bytes
//   }

//   return multer({ storage, fileFilter, limits });
// }


// module.exports = createUpload;














// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sanitize = require('sanitize-filename');

// Base upload directory (consistent casing)
const BASE_UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure upload folder exists
function ensureDir(folder) {
  const dir = path.join(BASE_UPLOAD_DIR, folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const safeName = sanitize(file.originalname);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(safeName));
    },
  });

  // File filter
  const fileFilter = function (req, file, cb) {
    const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  };

  // Limits
  const limits = {};
  if (options.fileSizeMB) {
    limits.fileSize = options.fileSizeMB * 1024 * 1024; // Convert MB to bytes
  }

  return multer({ storage, fileFilter, limits });
}

module.exports = createUpload;