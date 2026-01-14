const express = require("express");
const router = express.Router();

const {
  checkAvailability
} = require("../../controllers/vendor/checkAvailabilityController");

/**
 * POST /api/availability/check
 * UNIVERSAL – ALL MODULES
 */
router.post("/check", checkAvailability);

module.exports = router;
