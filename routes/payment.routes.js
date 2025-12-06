// const express = require("express");
// const router = express.Router();

// const legacy = require("../controllers/payment.smart_legacy.controller");

// router.post("/create-order", legacy.createOrderLegacy);

// module.exports = router;


const express = require("express");
const router = express.Router();

const controller = require("../controllers/payment.smart_legacy.controller");

// Test endpoint to verify SDK is working
router.get("/test-connection", controller.testConnection);

// Main payment creation endpoint
router.post("/create-payment-session", controller.createSmartGatewayPayment);

module.exports = router;
