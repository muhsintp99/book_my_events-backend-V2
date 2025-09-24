// const express = require('express');
// const router = express.Router();
// const createUpload = require('../../middlewares/upload');
// const venueController = require('../../controllers/vendor/venueController');

// const upload = createUpload('venues', {
//   fileSizeMB: 5, // allow up to 5 MB images
//   allowedTypes: ['image/png', 'image/jpeg']
// });

// router
//   .route('/')
//   .get(venueController.getVenues)
//   .post(
//     upload.fields([
//       { name: 'thumbnail', maxCount: 1 },
//       { name: 'images', maxCount: 10 }
//     ]),
//     venueController.createVenue
//   );

// router.get('/count', venueController.getVenueCounts);

// router
//   .route('/:id')
//   .get(venueController.getVenue)
//   .put(
//     upload.fields([
//       { name: 'thumbnail', maxCount: 1 },
//       { name: 'images', maxCount: 10 }
//     ]),
//     venueController.updateVenue
//   )
//   .delete(venueController.deleteVenue);

// router.patch('/:id/toggle', venueController.toggleVenueStatus);

// module.exports = router;
const express = require('express');
const router = express.Router();
const venueController = require('../../controllers/vendor/venueController');
const { protect, authorizeRoles } = require('../../middlewares/authMiddleware');
const createUpload = require('../../middlewares/upload');

// Upload middleware for venues
const upload = createUpload('venues', {
  fileSizeMB: 5,
  allowedTypes: ['image/png', 'image/jpeg']
});

// ================= VENUE ROUTES =================

// Create venue (vendor auto-link via JWT)
router.post(
  '/',
  protect,
  authorizeRoles('vendor'),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 5 }
  ]),
  venueController.createVenue
);

// Create venue for a specific provider (admin only)
router.post(
  '/provider/:providerId',
  protect,
  authorizeRoles('admin'),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 5 }
  ]),
  venueController.createVenueForProvider
);

// Get all venues (admin sees all, vendor sees only their own)
router.get(
  '/',
  protect,
  authorizeRoles('admin', 'vendor'),
  async (req, res, next) => {
    try {
      if (req.user.role === 'vendor') {
        // Vendor sees only their venues
        const venues = await venueController.getVenuesByProviderInternal(req.user._id);
        return res.status(200).json({ success: true, count: venues.length, data: venues });
      } else {
        // Admin sees all venues
        return venueController.getVenues(req, res, next);
      }
    } catch (err) {
      next(err);
    }
  }
);

// Get all venues by providerId
router.get(
  '/provider/:providerId',
  protect,
  authorizeRoles('admin', 'vendor'),
  venueController.getVenuesByProvider
);

// Get a single venue by venueId
router.get('/:id', protect, venueController.getVenue);

// Update a venue
router.put(
  '/:id',
  protect,
  authorizeRoles('vendor', 'admin'),
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'images', maxCount: 5 }
  ]),
  venueController.updateVenue
);

// Delete a venue
router.delete('/:id', protect, authorizeRoles('vendor', 'admin'), venueController.deleteVenue);

// Toggle venue status (admin only)
router.patch('/:id/toggle-status', protect, authorizeRoles('admin'), venueController.toggleVenueStatus);

// Venue counts (admin only)
router.get('/stats/counts', protect, authorizeRoles('admin'), venueController.getVenueCounts);

module.exports = router;
