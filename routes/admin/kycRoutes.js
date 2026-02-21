const express = require("express");
const router = express.Router();
const kycController = require("../../controllers/admin/kycController");

// TODO: Add auth middleware if needed
// const { protect, adminOnly } = require("../../middlewares/authMiddleware");

/**
 * @route   GET /api/admin/kyc
 * @desc    Get all vendor KYC requests
 * @access  Private/Admin
 */
router.get("/", kycController.getAllKycRequests);

/**
 * @route   PUT /api/admin/kyc/status
 * @desc    Accept or reject vendor KYC
 * @access  Private/Admin
 */
router.put("/status", kycController.updateKycStatus);

module.exports = router;
