const express = require("express");
const router = express.Router();
const { getPremiumHighlights } = require("../../controllers/vendor/premiumVendorController");

/**
 * @route   GET /api/premium-highlights
 * @desc    Get all premium vendors and packages across all modules
 * @access  Public
 */
router.get("/", getPremiumHighlights);

module.exports = router;
