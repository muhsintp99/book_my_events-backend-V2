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
const {upload} = require("../../middlewares/upload");
const venueController = require('../../controllers/vendor/venueController');
const { protect, authorizeRoles } = require('../../middlewares/authMiddleware');

// ✅ Correctly close the createUpload options
const setVenueFolder = (req, res, next) => {
  req.folder = "venue";
  next();
};

// ---------------- GET / POST ----------------
router
  .route('/')
  .get(venueController.getVenues) // Public access
  .post(
    protect,
    authorizeRoles('vendor', 'admin'),
    setVenueFolder,
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 5 }
    ]),
    venueController.createVenue
  );

// ---------------- GET BY PROVIDER ----------------
// Must come BEFORE /:id routess
router.get(
  '/provider/:providerId',
  venueController.getVenuesByProvider
);

// ---------------- COUNT ----------------
router.get('/count', venueController.getVenueCounts);

// ---------------- GET / PUT / DELETE ----------------
router
  .route('/:id')
  .get(venueController.getVenue)
  .put(
    protect,
    authorizeRoles('vendor', 'admin'),
    setVenueFolder,
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 5 }
    ]),
    venueController.updateVenue
  )
  .delete(
    protect,
    authorizeRoles('vendor', 'admin'),
    venueController.deleteVenue
  );

// ---------------- TOGGLE STATUS ----------------
router.patch(
  '/:id/toggle',
  protect,
  authorizeRoles('vendor', 'admin'),
  venueController.toggleVenueStatus
);

module.exports = router;
