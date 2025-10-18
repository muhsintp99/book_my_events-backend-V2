// const express = require('express');
// const router = express.Router();
// const createUpload = require('../../middlewares/upload'); 
// const vehicleController = require('../../controllers/vendor/vehicleCntroller');

// // Multer Upload Setup
// const upload = createUpload('vehicles', { fileSizeMB: 20 });

// // File fields
// const uploadFields = upload.fields([
//   { name: 'images', maxCount: 10 },
//   { name: 'thumbnail', maxCount: 1 },
//   { name: 'documents', maxCount: 5 }
// ]);

// // Routes
// router.post('/', uploadFields, vehicleController.createVehicle);
// router.get('/', vehicleController.getVehicles);
// router.get('/:id', vehicleController.getVehicle);
// router.put('/:id', uploadFields, vehicleController.updateVehicle);
// router.delete('/:id', vehicleController.deleteVehicle);

// // Block & Reactivate
// router.patch('/:id/block', vehicleController.blockVehicle);
// router.patch('/:id/reactivate', vehicleController.reactivateVehicle);

// module.exports = router;
// const express = require('express');
// const router = express.Router();
// const createUpload = require('../../middlewares/upload'); 
// const vehicleController = require('../../controllers/vendor/vehicleCntroller');
// const { protect, authorizeRoles } = require('../../middlewares/authMiddleware');

// // Multer Upload Setup
// const upload = createUpload('vehicles', { fileSizeMB: 20 });

// // File fields
// const uploadFields = upload.fields([
//   { name: 'images', maxCount: 10 },
//   { name: 'thumbnail', maxCount: 1 },
//   { name: 'documents', maxCount: 5 }
// ]);

// // ================= VEHICLE ROUTES =================

// // Create vehicle
// router.post('/', protect, authorizeRoles('vendor', 'admin'), uploadFields, vehicleController.createVehicle);

// router.get('/', protect, authorizeRoles('vendor', 'admin'), vehicleController.getVehicles);

// // Get vehicles by provider
// router.get('/provider/:providerId', protect, authorizeRoles('vendor', 'admin'), vehicleController.getVehiclesByProvider);

// // Get single vehicle
// router.get('/:id', protect, authorizeRoles('vendor', 'admin'), vehicleController.getVehicle);

// // Update vehicle
// router.put('/:id', protect, authorizeRoles('vendor', 'admin'), uploadFields, vehicleController.updateVehicle);

// // Delete vehicle
// router.delete('/:id', protect, authorizeRoles('vendor', 'admin'), vehicleController.deleteVehicle);

// // Block & Reactivate
// router.patch('/:id/block', protect, authorizeRoles('vendor', 'admin'), vehicleController.blockVehicle);
// router.patch('/:id/reactivate', protect, authorizeRoles('vendor', 'admin'), vehicleController.reactivateVehicle);

// module.exports = router;

const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const vehicleController = require('../../controllers/vendor/vehicleController'); // FIXED import
const { protect, authorizeRoles } = require('../../middlewares/authMiddleware');

const upload = createUpload('vehicles', { fileSizeMB: 20 });
const uploadFields = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'documents', maxCount: 5 },
]);

// Optional auth for GET routes
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
};

// Public / optional authentication
router.get('/', optionalAuth, vehicleController.getVehicles);
router.get('/provider/:providerId', vehicleController.getVehiclesByProvider);
router.get('/:id', optionalAuth, vehicleController.getVehicle);

// Protected routes
router.post(
  '/',
  protect,
  authorizeRoles('vendor', 'admin'),
  uploadFields,
  vehicleController.createVehicle
);

router.put(
  '/:id',
  protect,
  authorizeRoles('vendor', 'admin'),
  uploadFields,
  vehicleController.updateVehicle
);

router.delete(
  '/:id',
  protect,
  authorizeRoles('vendor', 'admin'),
  vehicleController.deleteVehicle
);

module.exports = router;
