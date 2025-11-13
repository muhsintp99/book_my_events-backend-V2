const juspay = require("../../config/juspay");
const config = require("../../config/config.json");
const { APIError } = require("expresscheckout-nodejs");



exports.createPaymentSession = async (req, res) => {
  try {
    const orderId = `order_${Date.now()}`;
    const amount = req.body.amount || 100;

    // STEP 1 - Create Order
    await juspay.post("/orders", {
      order_id: orderId,
      amount: amount,
      currency: "INR"
    });

    // STEP 2 - Create Session
    const session = await juspay.post("/payment/session", {
      order_id: orderId,
      amount: amount,
      action: "paymentPage",
      payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
      return_url: "https://yourwebsite.com/payment-status",
      currency: "INR",

      customer_id: "testing-customer-one",
      customer_phone: "9876543210",
      customer_email: "test@mail.com",
      first_name: "John",
      last_name: "Wick",
      description: "Complete your payment",

      "options.getUpiDeepLinks": true
    });

    return res.json({
      success: true,
      ...session.data
    });

  } catch (error) {
    console.log("SESSION ERROR:", error.response?.data || error.message);
    return res.json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};

// -----------------------------
// Initiate Payment (Simple)
// -----------------------------
exports.initiateJuspayPayment = async (req, res) => {
  try {
    const orderId = `order_${Date.now()}`;
    const amount = req.body.amount || 100;

    // Create Order
    await juspay.post("/orders", {
      order_id: orderId,
      amount: amount,
      currency: "INR"
    });

    // Create Session (Simple)
    const session = await juspay.post("/payment/session", {
      order_id: orderId,
      payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
      action: "paymentPage"
    });

    return res.json({
      success: true,
      orderId,
      paymentLink: session.data.payment_links.web,
      raw: session.data
    });

  } catch (error) {
    console.log("JUSPAY ERROR:", error.response?.data || error.message);
    return res.json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};

exports.handleJuspayResponse = async (req, res) => {
  try {
    const orderId = req.body.order_id || req.body.orderId;

    if (!orderId) {
      return res.json({ success: false, message: "Order ID missing" });
    }

    const statusResponse = await juspay.order.status(orderId);

    let statusMsg = "";
    switch (statusResponse.status) {
      case "CHARGED":
        statusMsg = "Payment Successful";
        break;
      case "PENDING":
      case "PENDING_VBV":
        statusMsg = "Payment Pending";
        break;
      case "AUTHORIZATION_FAILED":
        statusMsg = "Authorization Failed";
        break;
      case "AUTHENTICATION_FAILED":
        statusMsg = "Authentication Failed";
        break;
      default:
        statusMsg = "Order Status: " + statusResponse.status;
    }

    if (statusResponse.http) delete statusResponse.http;

    return res.json({
      success: true,
      message: statusMsg,
      data: statusResponse,
    });

  } catch (error) {
    if (error instanceof APIError) {
      return res.json({ success: false, error: error.message });
    }
    return res.json({ success: false, error: error.message });
  }
};
