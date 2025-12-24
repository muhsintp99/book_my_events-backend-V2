const express = require("express");
const router = express.Router();
const phonepeController = require("../../controllers/admin/phonepe.controller");
const { protect, adminOnly } = require("../../middlewares/authMiddleware");

/**
 * PHONEPE PAYMENT ROUTES FOR SUBSCRIPTION
 */

// Initiate payment (Admin only)
router.post("/initiate", protect, adminOnly, phonepeController.initiatePayment);

// PhonePe callback webhook (No auth - called by PhonePe)
router.post("/callback", phonepeController.paymentCallback);

// Check payment status (Admin only)
router.get("/status/:merchantTransactionId", protect, adminOnly, phonepeController.checkPaymentStatus);

// Get all payments (Admin only)
router.get("/all", protect, adminOnly, phonepeController.getAllPayments);

// Get payment by ID (Admin only)
router.get("/:id", protect, adminOnly, phonepeController.getPaymentById);

module.exports = router;
