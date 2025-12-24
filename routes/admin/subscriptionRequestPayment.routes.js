const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/subscriptionRequestPayment.controller");
const { protect, adminOnly } = require("../../middlewares/authMiddleware");

/**
 * HDFC SUBSCRIPTION REQUEST PAYMENT ROUTES
 */

// Initiate payment for subscription request (Admin only)
router.post("/initiate", protect, controller.initiateSubscriptionRequestPayment);

// Verify payment (can be called by admin or vendor after payment)
router.post("/verify", controller.verifySubscriptionRequestPayment);

module.exports = router;
