const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const packageController = require('../../controllers/admin/packageController');

// ✅ Create upload middleware for "packages"
const upload = createUpload('packages', {
  fileSizeMB: 5,
  allowedTypes: ['image/png', 'image/jpeg', 'image/webp']
});

// ============================
// 📦 Package Routes
// ============================

// ✅ Create Package (supports multiple images + 1 thumbnail)
router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 10 }, // ⬅️ multiple images supported
    { name: 'thumbnail', maxCount: 1 } // single thumbnail
  ]),
  packageController.createPackage
);

// ✅ Update Package (supports replacing multiple images + thumbnail)
router.put(
  '/:id',
  upload.fields([
    { name: 'images', maxCount: 10 }, // ⬅️ multiple images supported
    { name: 'thumbnail', maxCount: 1 }
  ]),
  packageController.updatePackage
);

// ✅ Get all packages for a specific module
router.get('/module/:moduleId', packageController.getPackagesByModule);

// ✅ Get packages by provider ID
router.get('/provider/:providerId', packageController.getPackagesByProvider);

// ✅ Get all packages
router.get('/', packageController.getPackages);

// ✅ Get single package by ID
router.get('/:id', packageController.getPackage);

// ✅ Delete Package
router.delete('/:id', packageController.deletePackage);

// ✅ Block Package
router.patch('/:id/block', packageController.blockPackage);

// ✅ Reactivate Package
router.patch('/:id/reactivate', packageController.reactivatePackage);

module.exports = router;
