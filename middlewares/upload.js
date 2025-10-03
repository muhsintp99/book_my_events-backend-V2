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

// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const sanitizePath = require('sanitize-filename');

// function createUpload(folder, options = {}) {
//   if (!folder || typeof folder !== 'string' || folder.includes('..') || folder.includes('/')) {
//     throw new Error('Invalid folder name');
//   }

//   const uploadDir = path.join(__dirname, `../uploads/${folder}`);

//   // Ensure directory exists
//   if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
//   }

//   const maxSize =
//     (options.fileSizeMB && options.fileSizeMB > 0 ? options.fileSizeMB : 10) *
//     1024 *
//     1024;

//   const allowedTypes = options.allowedTypes || [
//     'image/jpeg',
//     'image/png',
//     'image/jpg',
//     'application/pdf',
//     'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'application/vnd.ms-excel',
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//   ];

//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, uploadDir);
//     },
//     filename: (req, file, cb) => {
//       const sanitizedName = sanitizePath(file.originalname);
//       cb(null, `${Date.now()}-${sanitizedName}`);
//     },
//   });

//   const fileFilter = (req, file, cb) => {
//     if (!allowedTypes.includes(file.mimetype)) {
//       return cb(
//         new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`),
//         false
//       );
//     }
//     cb(null, true);
//   };

//   return multer({
//     storage,
//     fileFilter,
//     limits: { fileSize: maxSize, fields: 10, files: 1 }, // Limit non-file fields
//   });
// }

// module.exports = createUpload;

// middlewares/upload.js
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const sanitizePath = require('sanitize-filename');

// function createUpload(folder, options = {}) {
//   if (!folder || typeof folder !== 'string' || folder.includes('..') || folder.includes('/')) {
//     throw new Error('Invalid folder name');
//   }

//   // ✅ __dirname is already inside middlewares folder, so just add uploads
//   const baseUploadDir = path.join(__dirname, 'uploads');
//   const uploadDir = path.join(baseUploadDir, folder);

//   // ✅ Create directories synchronously before multer initialization
//   try {
//     if (!fs.existsSync(baseUploadDir)) {
//       fs.mkdirSync(baseUploadDir, { recursive: true });
//       console.log(`Created base upload directory: ${baseUploadDir}`);
//     }
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//       console.log(`Created upload directory: ${uploadDir}`);
//     }
//   } catch (error) {
//     console.error(`Failed to create upload directories: ${error.message}`);
//     throw error;
//   }

//   const maxSize =
//     (options.fileSizeMB && options.fileSizeMB > 0 ? options.fileSizeMB : 10) *
//     1024 *
//     1024;

//   const allowedTypes = options.allowedTypes || [
//     'image/jpeg',
//     'image/png',
//     'image/jpg',
//     'application/pdf',
//     'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'application/vnd.ms-excel',
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//   ];

//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       // ✅ Verify directory exists at request time
//       if (!fs.existsSync(uploadDir)) {
//         try {
//           fs.mkdirSync(uploadDir, { recursive: true });
//           console.log(`Created missing upload directory: ${uploadDir}`);
//         } catch (error) {
//           console.error(`Failed to create directory in destination callback: ${error.message}`);
//           return cb(error);
//         }
//       }
//       console.log(`Saving file to: ${uploadDir}`);
//       cb(null, uploadDir);
//     },
//     filename: (req, file, cb) => {
//       const sanitizedName = sanitizePath(file.originalname);
//       const uniqueFilename = `${Date.now()}-${sanitizedName}`;
//       console.log(`Generated filename: ${uniqueFilename}`);
//       cb(null, uniqueFilename);
//     },
//   });

//   const fileFilter = (req, file, cb) => {
//     if (!allowedTypes.includes(file.mimetype)) {
//       return cb(
//         new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`),
//         false
//       );
//     }
//     cb(null, true);
//   };

//   return multer({
//     storage,
//     fileFilter,
//     limits: {
//       fileSize: maxSize,
//       fields: Infinity,
//       files: 11,
//     },
//   });
// }

// module.exports = createUpload;
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const sanitizePath = require('sanitize-filename');

// function createUpload(folder, options = {}) {
//   // ---------- Validate folder name ----------
//   if (!folder || typeof folder !== 'string' || folder.includes('..') || folder.includes('/')) {
//     console.error(`Invalid folder name provided: ${folder}`);
//     throw new Error('Invalid folder name');
//   }

//   // ---------- Set upload directories ----------
//   const baseUploadDir = path.join(__dirname, '..', 'Uploads'); // Relative to project root
//   const uploadDir = path.join(baseUploadDir, folder);

//   // ---------- Create directories if not exist ----------
//   try {
//     fs.mkdirSync(uploadDir, { recursive: true });
//     console.log(`Upload directory ensured: ${uploadDir}`);
//   } catch (error) {
//     console.error(`Failed to create upload directory: ${error.message}`);
//     throw new Error(`Failed to create upload directory: ${error.message}`);
//   }

//   // ---------- Set limits and allowed types ----------
//   const maxSize = (options.fileSizeMB || 50) * 1024 * 1024;
//   const allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png'];

//   // ---------- Storage config ----------
//   const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       console.log(`Saving file to: ${uploadDir}`);
//       cb(null, uploadDir);
//     },
//     filename: (req, file, cb) => {
//       const sanitizedName = sanitizePath(file.originalname);
//       const uniqueFilename = `${Date.now()}-${sanitizedName}`;
//       console.log(`Generated filename: ${uniqueFilename}`);
//       cb(null, uniqueFilename);
//     },
//   });

//   // ---------- File filter ----------
//   const fileFilter = (req, file, cb) => {
//     if (!allowedTypes.includes(file.mimetype)) {
//       const error = new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
//       console.error(`File rejected: ${file.originalname} (type: ${file.mimetype})`);
//       return cb(error, false);
//     }
//     cb(null, true);
//   };

//   // ---------- Return multer instance ----------
//   return multer({
//     storage,
//     fileFilter,
//     limits: {
//       fileSize: maxSize,
//       files: options.maxFiles || 11, // Allow thumbnail + 10 images
//       fields: Infinity,
//     },
//   });
// }

// module.exports = createUpload;

// ----------------------------------------------------------------------------------------------------------------------

// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// const STORAGE_PATH = process.env.MULTER_STORAGE_PATH || "uploads";
// const FILE_SIZE_LIMIT =
//   parseInt(process.env.MULTER_FILE_SIZE_LIMIT) || 5 * 1024 * 1024;
// const ALLOWED_TYPES = (
//   process.env.MULTER_ALLOWED_FILE_TYPES || "image/jpeg,image/png"
// ).split(",");
// const BASE_URL = process.env.MULTER_USE_URL || "http://localhost:5000";

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const folder = req.folder || "general";
//     const uploadPath = path.join(STORAGE_PATH, folder);

//     // ✅ Ensure directory exists
//     fs.mkdirSync(uploadPath, { recursive: true });

//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName =
//       Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
//     cb(null, uniqueName);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (ALLOWED_TYPES.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     // ✅ FIXED: use backticks
//     cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`));
//   }
// };

// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { fileSize: FILE_SIZE_LIMIT },
// });

// // ✅ FIXED: use backticks
// const fileUrl = (folder, filename) =>
//   `${BASE_URL}/${STORAGE_PATH}/${folder}/${filename}`;

// module.exports = { upload, fileUrl };

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const STORAGE_PATH = process.env.MULTER_STORAGE_PATH || "uploads";
const FILE_SIZE_LIMIT =
  parseInt(process.env.MULTER_FILE_SIZE_LIMIT) || 5 * 1024 * 1024;
const ALLOWED_TYPES = (
  process.env.MULTER_ALLOWED_FILE_TYPES || "image/jpeg,image/png"
).split(",");
const BASE_URL = process.env.MULTER_USE_URL || "http://localhost:5000";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.folder || "general";
    const uploadPath = path.join(STORAGE_PATH, folder);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
  else
    cb(
      new Error(`Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`)
    );
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: FILE_SIZE_LIMIT },
});

const fileUrl = (folder, filename) =>
  `${BASE_URL}/${STORAGE_PATH}/${folder}/${filename}`;

module.exports = { upload, fileUrl };
