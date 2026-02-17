const express = require('express');
const router = express.Router();
const pincodeController = require('../../controllers/vendor/pincodeController');

router.get('/radius', pincodeController.getPincodesInRadius);
router.post('/', pincodeController.createPincode);

module.exports = router;
