const express = require("express");
const router = express.Router();
const { createJuspayOrder } = require("../../controllers/admin/paymentController");

router.post("/create-order", createJuspayOrder);

module.exports = router;
