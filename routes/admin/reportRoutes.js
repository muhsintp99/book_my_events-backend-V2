const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/admin/reportController');
// const { protect, authorize } = require('../../middlewares/auth'); // In case auth is needed

// Admin View: System-wide payment and all-around reports
router.get('/admin/payments', reportController.getAdminPaymentReport);
router.get('/admin/all-around', reportController.getAdminAllAroundReport);

// Vendor View: Individual vendor earning and activity reports (using vendorId in path)
router.get('/vendor/:vendorId/payments', reportController.getVendorPaymentReport);
router.get('/vendor/:vendorId/all-around', reportController.getVendorAllAroundReport);



module.exports = router;
