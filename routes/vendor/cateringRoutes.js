const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const cateringController = require('../../controllers/vendor/cateringcategoryController');

// ✅ Create upload middleware for "catering"
const upload = createUpload('catering', {
  fileSizeMB: 5,
  allowedTypes: ['image/png', 'image/jpeg', 'image/webp']
});

// ============================
// 🍽 Catering Routes
// ============================

// ✅ Create Catering
router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  cateringController.createCatering
);

// ✅ Update Catering
router.put(
  '/:id',
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  cateringController.updateCatering
);

// ✅ Get by module
router.get('/module/:moduleId', cateringController.getCateringsByModule);

// ✅ Get by provider
router.get('/provider/:providerId', cateringController.getCateringsByProvider);

// ✅ Get all
router.get('/', cateringController.getCaterings);

// ✅ Get single
router.get('/:id', cateringController.getCatering);

// ✅ Delete
router.delete('/:id', cateringController.deleteCatering);

// ✅ Block
router.patch('/:id/block', cateringController.blockCatering);

// ✅ Reactivate
router.patch('/:id/reactivate', cateringController.reactivateCatering);

module.exports = router;
