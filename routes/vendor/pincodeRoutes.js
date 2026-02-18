const express = require('express');
const router = express.Router();
const pincodeController = require('../../controllers/vendor/pincodeController');

// 🔹 Get all pincodes
router.get('/', pincodeController.getAllPincodes);

// 🔹 Get pincodes within radius
router.get('/radius', pincodeController.getPincodesInRadius);

// 🔹 Create new pincode
router.post('/', pincodeController.createPincode);

// 🔹 Update pincode
router.put('/:id', pincodeController.updatePincode);

// 🔹 Delete pincode
router.delete('/:id', pincodeController.deletePincode);

module.exports = router;
