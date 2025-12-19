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
router.post("/juspay-webhook", controller.juspayWebhook);

router.post("/create-subscription-payment", controller.createSubscriptionPayment);

router.get("/handle-response", controller.handleJuspayResponse);


// routes/paymentRoutes.js
router.post("/subscription-return", async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.redirect(
        "https://www.bookmyevent.ae/subscription-status.html?status=failed"
      );
    }

    const order = await juspay.order.status(order_id);

    if (order.status === "CHARGED") {
      // ✅ activate subscription here if not already done
      return res.redirect(
        `https://www.bookmyevent.ae/subscription-status.html?status=success&orderId=${order_id}`
      );
    }

    return res.redirect(
      `https://www.bookmyevent.ae/subscription-status.html?status=failed&orderId=${order_id}`
    );
  } catch (err) {
    console.error("Return URL error:", err);
    return res.redirect(
      "https://www.bookmyevent.ae/subscription-status.html?status=failed"
    );
  }
});

module.exports = router;
