const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload'); 
const vehicleController = require('../../controllers/vendor/vehicleCntroller');

// Multer Upload Setup
const upload = createUpload('vehicles', { fileSizeMB: 20 });

// File fields
const uploadFields = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
]);

// Routes
router.post('/', uploadFields, vehicleController.createVehicle);
router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicle);
router.put('/:id', uploadFields, vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

// Block & Reactivate
router.patch('/:id/block', vehicleController.blockVehicle);
router.patch('/:id/reactivate', vehicleController.reactivateVehicle);

module.exports = router;
