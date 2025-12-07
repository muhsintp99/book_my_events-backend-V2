// // const express = require("express");
// // const router = express.Router();

// // const legacy = require("../controllers/payment.smart_legacy.controller");

// // router.post("/create-order", legacy.createOrderLegacy);

// // module.exports = router;


// const express = require("express");
// const router = express.Router();

// const controller = require("../controllers/payment.smart_legacy.controller");



// // Test endpoint to verify SDK is working
// router.get("/test-connection", controller.testConnection);

// // Main payment creation endpoint
// router.post("/create-payment-session", controller.createSmartGatewayPayment);

// router.post("/create-subscription-payment", controller.createSubscriptionPayment);

// router.get("/handle-response", controller.handleJuspayResponse);

// module.exports = router;


const express = require("express");
const router = express.Router();

const controller = require("../controllers/payment.smart_legacy.controller");

// ✅ Test endpoint to verify SDK is working
router.get("/test-connection", controller.testConnection);

// ✅ Main payment creation endpoint
router.post("/create-payment-session", controller.createSmartGatewayPayment);

// ✅ Subscription payment
router.post("/create-subscription-payment", controller.createSubscriptionPayment);

// ✅ Handle payment response (called by HDFC after payment)
router.get("/handle-response", controller.handleJuspayResponse);

// ✅ NEW: Verify payment status (called by frontend after redirect)
router.get("/verify-payment", controller.verifyPayment);

// ✅ NEW: Success page handler (alternative redirect endpoint)
router.get("/payment-success", controller.handlePaymentSuccess);

module.exports = router;