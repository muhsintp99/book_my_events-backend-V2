const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const venueController = require('../../controllers/vendor/venueController');

const upload = createUpload('venues', {
  fileSizeMB: 5, // allow up to 5 MB images
  allowedTypes: ['image/png', 'image/jpeg']
});

router
  .route('/')
  .get(venueController.getVenues)
  .post(
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 10 }
    ]),
    venueController.createVenue
  );

router.get('/count', venueController.getVenueCounts);

router
  .route('/:id')
  .get(venueController.getVenue)
  .put(
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 10 }
    ]),
    venueController.updateVenue
  )
  .delete(venueController.deleteVenue);

router.patch('/:id/toggle', venueController.toggleVenueStatus);

module.exports = router;
