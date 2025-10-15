const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const vehicleCategoryController = require('../../controllers/admin/vehiclecategoryController');

// ✅ Create upload instance
const upload = createUpload('vehicle-categories', {
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

// Create vehicle category
router.post('/', handleUpload, vehicleCategoryController.createVehicleCategory);

// Get vehicle categories by module - FIXED ROUTE
router.get('/modules/:moduleId', vehicleCategoryController.getVehicleCategoriesByModule);

// Get all vehicle categories
router.get('/', vehicleCategoryController.getVehicleCategories);

// Get single vehicle category
router.get('/:id', vehicleCategoryController.getVehicleCategory);

// Update vehicle category
router.put('/:id', handleUpload, vehicleCategoryController.updateVehicleCategory);

// Delete vehicle category
router.delete('/:id', vehicleCategoryController.deleteVehicleCategory);

// Block/Reactivate routes
router.patch('/:id/block', vehicleCategoryController.blockVehicleCategory);
router.patch('/:id/reactivate', vehicleCategoryController.reactivateVehicleCategory);

module.exports = router;