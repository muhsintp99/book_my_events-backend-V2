const express = require("express");
const router = express.Router();

const legacy = require("../controllers/payment.smart_legacy.controller");

router.post("/create-order", legacy.createOrderLegacy);

module.exports = router;
