
// const express = require('express');
// const router = express.Router();
// const createUpload = require('../../middlewares/upload');
// const venueController = require('../../controllers/vendor/venueController');
// const { protect, authorizeRoles } = require('../../middlewares/authMiddleware');

// // ✅ Correctly close the createUpload options
// const upload = createUpload('venues', {
//   fileSizeMB: 5,
//   allowedTypes: ['image/png', 'image/jpeg']
// });

// // ---------------- GET / POST ----------------
// router
//   .route('/')
//   .get(venueController.getVenues) // Public access
//   .post(
//     protect,
//     authorizeRoles('vendor', 'admin'),
//     upload.fields([
//       { name: 'thumbnail', maxCount: 1 },
//       { name: 'images', maxCount: 10 }
//     ]),
//     venueController.createVenue
//   );

// // ---------------- GET BY PROVIDER ----------------
// // Must come BEFORE /:id routess
// router.get(
//   '/provider/:providerId',
//   venueController.getVenuesByProvider
// );

// // ---------------- COUNT ----------------
// router.get('/count', venueController.getVenueCounts);

// // ---------------- GET / PUT / DELETE ----------------
// router
//   .route('/:id')
//   .get(venueController.getVenue)
//   .put(
//     protect,
//     authorizeRoles('vendor', 'admin'),
//     upload.fields([
//       { name: 'thumbnail', maxCount: 1 },
//       { name: 'images', maxCount: 10 }
//     ]),
//     venueController.updateVenue
//   )
//   .delete(
//     protect,
//     authorizeRoles('vendor', 'admin'),
//     venueController.deleteVenue
//   );

// // ---------------- TOGGLE STATUS ----------------
// router.patch(
//   '/:id/toggle',
//   protect,
//   authorizeRoles('vendor', 'admin'),
//   venueController.toggleVenueStatus
// );

// module.exports = router;


const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/authMiddleware');
const createUpload = require('../../middlewares/upload');
const venueController = require('../../controllers/vendor/venueController');

const upload = createUpload('venues', {
  fileSizeMB: 5,
  allowedTypes: ['image/png', 'image/jpeg', 'application/pdf'],
});

// All Venues
router
  .route('/')
  .get(venueController.getVenues)
  .post(
    protect,
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
    venueController.createVenue
  );

// Counts and toggle
router.get('/count', venueController.getVenueCounts);
router.patch('/:id/toggle', venueController.toggleVenueStatus);

// Pricing routes — placed BEFORE /:id
router.get('/:id/pricing', venueController.getPricing);
router.put('/:id/pricing', venueController.updatePricing);

// Single Venue routes
router
  .route('/:id')
  .get(venueController.getVenue)
  .put(
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 10 },
    ]),
    venueController.updateVenue
  )
  .delete(venueController.deleteVenue);

module.exports = router;