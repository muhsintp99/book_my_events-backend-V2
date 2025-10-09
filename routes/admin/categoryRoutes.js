// const express = require('express');
// const router = express.Router();
// const createUpload = require('../../middlewares/upload');
// const categoryController = require('../../controllers/admin/categoryController');

// const upload = createUpload('categories', {
//   fileSizeMB: 2,
//   allowedTypes: ['image/png', 'image/jpeg']
// });

// router.post('/', upload.single('image'), categoryController.createCategory);
// router.get('/module/:moduleId', categoryController.getCategoriesByModule);
// router.put('/:id', upload.single('image'), categoryController.updateCategory);
// router.delete('/:id', categoryController.deleteCategory);
// router.get('/', categoryController.getCategories);
// router.get('/:id', categoryController.getCategory);

// // Block/Reactivate
// router.patch('/:id/block', categoryController.blockCategory);
// router.patch('/:id/reactivate', categoryController.reactivateCategory);

// module.exports = router;

const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const categoryController = require('../../controllers/admin/categoryController');

// ✅ Create upload instance
const upload = createUpload('categories', {
  fileSizeMB: 2,
  allowedTypes: ['image/png', 'image/jpeg', 'image/jpg']
});

// ✅ Wrapper to catch Multer errors safely
const handleUpload = (req, res, next) => {
  try {
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('❌ Multer Upload Error:', err.message);
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  } catch (error) {
    console.error('❌ Unexpected Upload Error:', error);
    return res.status(500).json({ success: false, message: 'Upload failed.' });
  }
};

// ---------------- ROUTES ----------------

// Create category
router.post('/', handleUpload, categoryController.createCategory);

// Get categories by module - FIXED ROUTE
router.get('/modules/:moduleId', categoryController.getCategoriesByModule);

// Get all categories
router.get('/', categoryController.getCategories);

// Get single category
router.get('/:id', categoryController.getCategory);

// Update category
router.put('/:id', handleUpload, categoryController.updateCategory);

// Delete category
router.delete('/:id', categoryController.deleteCategory);

// Block/Reactivate routes
router.patch('/:id/block', categoryController.blockCategory);
router.patch('/:id/reactivate', categoryController.reactivateCategory);

module.exports = router;
