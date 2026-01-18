const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const vehicleController = require('../../controllers/vendor/vehicleController');
const { protect, authorizeRoles } = require('../../middlewares/authMiddleware');

const upload = createUpload('vehicles', { fileSizeMB: 20 });
const uploadFields = upload.fields([
  { name: 'featuredImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 10 },
  { name: 'vehicleDocuments', maxCount: 10 },
]);

// Optional auth for GET routes
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    return protect(req, res, next);
  }
  next();
};

// ================= PUBLIC / OPTIONAL AUTH =================
router.get('/', optionalAuth, vehicleController.getVehicles);
router.get('/filter', optionalAuth, vehicleController.filterVehicles);
router.get('/search', optionalAuth, vehicleController.searchVehicles);
router.get('/sort', optionalAuth, vehicleController.sortVehicles);
router.get('/location', optionalAuth, vehicleController.getVehiclesByLocation);
router.get('/provider/:providerId', optionalAuth, vehicleController.getVehiclesByProvider);
router.get('/category/:categoryId', optionalAuth, vehicleController.getVehiclesByCategory);

// ✅ MUST be before `/:id`
router.get(
  '/vendors/:moduleId',
  optionalAuth,
  vehicleController.getVendorsForVehicleModule
);

router.get('/counts', protect, authorizeRoles('admin'), vehicleController.getVehicleCounts);

// ✅ SINGLE ID ROUTE (ONLY ONCE)
router.get('/:id', optionalAuth, vehicleController.getVehicle);

// ================= PROTECTED ROUTES =================
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

router.put(
  '/:id/block',
  protect,
  authorizeRoles('vendor', 'admin'),
  vehicleController.blockVehicle
);

router.put(
  '/:id/reactivate',
  protect,
  authorizeRoles('vendor', 'admin'),
  vehicleController.reactivateVehicle
);

module.exports = router;
