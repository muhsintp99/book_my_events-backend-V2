const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const renterController = require('../../controllers/vendor/renterController');

const upload = createUpload('renters', {
  fileSizeMB: 5,
  allowedTypes: ['image/png', 'image/jpeg']
});

router
  .route('/')
  .get(renterController.getRenters)
  .post(
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'vehicleImages', maxCount: 10 }
    ]),
    renterController.createRenter
  );

router.get('/count', renterController.getRenterCounts);

router
  .route('/:id')
  .get(renterController.getRenter)
  .put(
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'vehicleImages', maxCount: 10 }
    ]),
    renterController.updateRenter
  )
  .delete(renterController.deleteRenter);

router.patch('/:id/toggle', renterController.toggleRenterStatus);

module.exports = router;
