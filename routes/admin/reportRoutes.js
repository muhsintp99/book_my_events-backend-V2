const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/admin/reportController');
// const { protect, authorize } = require('../../middlewares/auth'); // In case auth is needed

// Admin View: System-wide payment report
router.get('/admin/payments', reportController.getAdminPaymentReport);

// Vendor View: Individual vendor earning report
router.get('/vendor/payments', reportController.getVendorPaymentReport);

module.exports = router;
