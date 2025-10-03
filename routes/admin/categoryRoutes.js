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
const categoryController = require('../../controllers/admin/categoryController');
const { upload } = require('../../middlewares/upload');

// const upload = createUpload('categories', {
//   fileSizeMB: 2,
//   allowedTypes: ['image/png', 'image/jpeg', 'image/jpg']
// });
const setBrandFolder = (req, res, next) => {
  req.folder = "brands";
  next();
};


// Create category
router.post('/', setBrandFolder,upload.single('image'), categoryController.createCategory);

// Get categories by module - FIXED ROUTE
router.get('/modules/:moduleId', categoryController.getCategoriesByModule);

// Get all categories
router.get('/', categoryController.getCategories);

// Get single category
router.get('/:id', categoryController.getCategory);

// Update category
router.put('/:id',setBrandFolder,upload.single('image'), categoryController.updateCategory);

// Delete category
router.delete('/:id', categoryController.deleteCategory);

// Block/Reactivate routes
router.patch('/:id/block', categoryController.blockCategory);
router.patch('/:id/reactivate', categoryController.reactivateCategory);

module.exports = router;








