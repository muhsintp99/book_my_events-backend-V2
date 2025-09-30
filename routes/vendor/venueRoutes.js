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
const createUpload = require('../../middlewares/upload');
const venueController = require('../../controllers/vendor/venueController');
const { protect, authorizeRoles } = require('../../middlewares/authMiddleware'); // ✅ Correct import

const upload = createUpload('venues', {
  fileSizeMB: 5,
  allowedTypes: ['image/png', 'image/jpeg']
});

// Debug log to confirm folder name
console.log('Creating upload middleware for folder: venues');

// ---------------- GET / POST ----------------
router
  .route('/')
  .get(venueController.getVenues) // Public access
  .post(
    protect, // Require authentication
    authorizeRoles('vendor', 'admin'), // Restrict to vendors and admins
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 10 }
    ]),
    venueController.createVenue
  );

// ---------------- COUNT ----------------
router.get('/count', venueController.getVenueCounts); // Public access

// ---------------- GET / PUT / DELETE ----------------
router
  .route('/:id')
  .get(venueController.getVenue) // Public access
  .put(
    protect, // Require authentication
    authorizeRoles('vendor', 'admin'), // Restrict to vendors and admins
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 10 }
    ]),
    venueController.updateVenue
  )
  .delete(
    protect, // Require authentication
    authorizeRoles('vendor', 'admin'), // Restrict to vendors and admins
    venueController.deleteVenue
  );

// ---------------- TOGGLE STATUS ----------------
router.patch(
  '/:id/toggle',
  protect, // Require authentication
  authorizeRoles('vendor', 'admin'), // Restrict to vendors and admins
  venueController.toggleVenueStatus
);

module.exports = router;