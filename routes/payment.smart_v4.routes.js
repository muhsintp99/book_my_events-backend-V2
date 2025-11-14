const express = require("express");
const router = express.Router();
const { createPaymentSession } = require("../controllers/payment.smart_v4.controller");

router.post("/sessions", createPaymentSession);

module.exports = router;
