// const multer = require('multer');
// const path = require('path');
// const fs = require('fs').promises;
// const sanitizePath = require('sanitize-filename'); 

// function createUpload(folder, options = {}) {
//   if (!folder || typeof folder !== 'string' || folder.includes('..') || folder.includes('/')) {
//     throw new Error('Invalid folder name');
//   }

//   const uploadDir = path.join(__dirname, `../Uploads/${folder}`);

//   const maxSize = (options.fileSizeMB && options.fileSizeMB > 0 ? options.fileSizeMB : 10) * 1024 * 1024; // Default 10 MB
//   const allowedTypes = options.allowedTypes || [
//     // Image types
//     'image/jpeg',
//     'image/png',
//     'image/jpg',
//     // Document types
//     'application/pdf',
//     'application/msword', // .doc
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
//     'application/vnd.ms-excel', // .xls
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
//   ];

//   const ensureDirectory = async () => {
//     try {
//       await fs.mkdir(uploadDir, { recursive: true });
//     } catch (err) {
//       throw new Error(`Failed to create upload directory: ${err.message}`);
//     }
//   };

//   // Initialize storage
//   const storage = multer.diskStorage({
//     destination: async (req, file, cb) => {
//       try {
//         await ensureDirectory();
//         cb(null, uploadDir);
//       } catch (err) {
//         cb(err);
//       }
//     },
//     filename: (req, file, cb) => {
//       const sanitizedName = sanitizePath(file.originalname);
//       cb(null, `${Date.now()}-${sanitizedName}`);
//     }
//   });

//   const fileFilter = (req, file, cb) => {
//     if (!allowedTypes.includes(file.mimetype)) {
//       const allowed = allowedTypes.join(', ');
//       return cb(new Error(`Invalid file type. Allowed types: ${allowed}`), false);
//     }
//     cb(null, true);
//   };

//   return multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: maxSize }
//   });
// }

// module.exports = createUpload;



const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const sanitizePath = require('sanitize-filename'); 

function createUpload(folder, options = {}) {
  if (!folder || typeof folder !== 'string' || folder.includes('..') || folder.includes('/')) {
    throw new Error('Invalid folder name');
  }

  const uploadDir = path.join(__dirname, `../Uploads/${folder}`);

  const maxSize = (options.fileSizeMB && options.fileSizeMB > 0 ? options.fileSizeMB : 10) * 1024 * 1024; // Default 10 MB
  const allowedTypes = options.allowedTypes || [
    // Image types
    'image/jpeg',
    'image/png',
    'image/jpg',
    // Document types
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
  ];

  const ensureDirectory = async () => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
      throw new Error(`Failed to create upload directory: ${err.message}`);
    }
  };

  // Initialize storage
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await ensureDirectory();
        cb(null, uploadDir);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      const sanitizedName = sanitizePath(file.originalname);
      cb(null, `${Date.now()}-${sanitizedName}`);
    }
  });

  const fileFilter = (req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      const allowed = allowedTypes.join(', ');
      return cb(new Error(`Invalid file type. Allowed types: ${allowed}`), false);
    }
    cb(null, true);
  };

  // Return plain multer instance (no wrapping)
  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSize }
  });
}

module.exports = createUpload;