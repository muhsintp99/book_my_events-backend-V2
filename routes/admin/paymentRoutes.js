const express = require("express");
const router = express.Router();

const {
  createPaymentSession,
  initiateJuspayPayment,
  handleJuspayResponse,
} = require("../../controllers/admin/paymentController");

router.post("/session", createPaymentSession);
router.post("/initiate", initiateJuspayPayment);
router.post("/handleJuspayResponse", handleJuspayResponse);

module.exports = router;
