const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const categoryController = require('../../controllers/admin/categoryController');

const upload = createUpload('categories', {
  fileSizeMB: 2,
  allowedTypes: ['image/png', 'image/jpeg']
});

router.post('/', upload.single('image'), categoryController.createCategory);
router.get('/module/:moduleId', categoryController.getCategoriesByModule);
router.put('/:id', upload.single('image'), categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);

// Block/Reactivate
router.patch('/:id/block', categoryController.blockCategory);
router.patch('/:id/reactivate', categoryController.reactivateCategory);

module.exports = router;
