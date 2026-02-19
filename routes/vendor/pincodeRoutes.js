const express = require('express');
const router = express.Router();
const pincodeController = require('../../controllers/vendor/pincodeController');
const { fixWrongAreaNames } = require('../../controllers/vendor/pincodeController');

router.get('/', pincodeController.getAllPincodes);
router.get('/fix-area', fixWrongAreaNames);
router.get('/radius', pincodeController.getPincodesInRadius);
router.get('/check-availability', pincodeController.checkDeliveryAvailability);
router.post('/', pincodeController.createPincode);
router.post('/bulk', pincodeController.bulkCreatePincodes);
router.put('/:id', pincodeController.updatePincode);
router.delete('/:id', pincodeController.deletePincode);

module.exports = router;

