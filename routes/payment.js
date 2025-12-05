const express = require("express");
const router = express.Router();

const {
  createPaymentSession
} = require("../controllers/admin/paymentController");

// ONLY ONE ROUTE — create session
router.post("/create-session", createPaymentSession);

module.exports = router;
