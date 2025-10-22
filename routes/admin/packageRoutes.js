const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const packageController = require('../../controllers/admin/packageController');

// ✅ Create upload middleware for "packages"
const upload = createUpload('packages', {
  fileSizeMB: 5, // You can adjust this if needed
  allowedTypes: ['image/png', 'image/jpeg', 'image/webp']
});

// ============================
// 📦 Package Routes
// ============================

// Create Package (uploads icon + thumbnail)
router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  packageController.createPackage
);

// Update Package (uploads icon + thumbnail)
router.put(
  '/:id',
  upload.fields([
    { name: 'icon', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  packageController.updatePackage
);

// ✅ Get all packages for a specific module
router.get('/module/:moduleId', packageController.getPackagesByModule);

// Delete Package
router.delete('/:id', packageController.deletePackage);

// Get all Packages
router.get('/', packageController.getPackages);

// Get single Package
router.get('/:id', packageController.getPackage);

// Block Package
router.patch('/:id/block', packageController.blockPackage);

// Reactivate Package
router.patch('/:id/reactivate', packageController.reactivatePackage);

module.exports = router;