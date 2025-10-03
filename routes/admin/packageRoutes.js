const express = require('express');
const router = express.Router();
const packageController = require('../../controllers/admin/packageController');
const { protect, authorizeRoles } = require('../../middlewares/authMiddleware');
const {upload} = require("../../middlewares/upload");

// Upload middleware for packages
const setPackageFolder = (req, res, next) => {
  req.folder = "package";
  next();
};

// ================= STATISTICS ROUTES =================
router.get('/stats/counts', protect, authorizeRoles('admin'), packageController.getPackageCounts);
router.get('/featured', packageController.getFeaturedPackages);

// ================= CREATE ROUTES =================
router.post(
  '/',
  protect,
  authorizeRoles('vendor', 'admin'),
  setPackageFolder,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  packageController.createPackage
);

router.post(
  '/provider/:providerId',
  protect,
  authorizeRoles('admin'),
  setPackageFolder,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  packageController.createPackageForProvider
);

// ================= READ ROUTES =================
router.get('/', protect, authorizeRoles('admin', 'vendor'), async (req, res, next) => {
  try {
    if (req.user.role === 'vendor') {
      const { page = 1, limit = 10, search = '', packageType, isActive } = req.query;
      const packages = await packageController.getPackagesByProviderInternal(req.user._id);

      let filteredPackages = packages;

      if (search) {
        filteredPackages = filteredPackages.filter(
          (p) =>
            p.packageName.toLowerCase().includes(search.toLowerCase()) ||
            (p.packageDescription &&
              p.packageDescription.toLowerCase().includes(search.toLowerCase()))
        );
      }

      if (packageType) {
        filteredPackages = filteredPackages.filter((p) => p.packageType === packageType);
      }

      if (isActive !== undefined) {
        filteredPackages = filteredPackages.filter((p) => p.isActive === (isActive === 'true'));
      }

      const total = filteredPackages.length;
      const skip = (page - 1) * limit;
      const paginatedPackages = filteredPackages.slice(skip, skip + Number(limit));

      return res.status(200).json({
        success: true,
        count: paginatedPackages.length,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        data: paginatedPackages
      });
    } else {
      return packageController.getPackages(req, res, next);
    }
  } catch (err) {
    next(err);
  }
});

router.get('/provider/:providerId', protect, authorizeRoles('admin', 'vendor'), packageController.getPackagesByProvider);
router.get('/venue/:venueId', protect, authorizeRoles('admin', 'vendor'), packageController.getPackagesByVenue);
router.get('/module/:moduleId', protect, authorizeRoles('admin', 'vendor'), packageController.getPackageByModuleId);

// ================= SINGLE PACKAGE =================
router.get('/:id', protect, packageController.getPackage);

// ================= UPDATE ROUTES =================
router.put(
  '/:id',
  protect,
  authorizeRoles('vendor', 'admin'),
  setPackageFolder,
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]),
  packageController.updatePackage
);

router.patch('/:id/toggle-status', protect, authorizeRoles('admin'), packageController.togglePackageStatus);

// ================= DELETE ROUTES =================
router.delete('/:id', protect, authorizeRoles('vendor', 'admin'), packageController.deletePackage);

module.exports = router;

// GET MODULE DETAILS WITH PACKAGE
router.get(
  '/module/:moduleId/:packageId',
  protect,
  authorizeRoles('admin', 'vendor'),
  packageController.getPackageModuleDetails
);