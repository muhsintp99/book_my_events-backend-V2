const juspay = require("../../config/juspay");
const config = require("../../config/smartgateway_config.json");
const { APIError } = require("expresscheckout-nodejs");



exports.createJuspayOrder = async (req, res) => {
  try {
    const orderId = "order_" + Date.now();
    const amount = req.body.amount || 100;

    // STEP 1 — Create Order
    const order = await juspay.post("/orders", {
      order_id: orderId,
      amount: amount,
      currency: "INR"
    });

    // STEP 2 — Create Session
    const session = await juspay.post("/payment/session", {
      order_id: orderId,
      amount: amount,
      currency: "INR",
      action: "paymentPage",
      payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
      return_url: "https://dashboard.bookmyevent.ae/payment-status",
      customer_id: "customer_" + Date.now(),
      customer_email: req.body.email || "test@mail.com",
      customer_phone: req.body.phone || "9876543210",
      first_name: req.body.firstName || "John",
      last_name: req.body.lastName || "Wick",
      description: "Complete your payment",
      "options.getUpiDeepLinks": true
    });

    return res.json({
      success: true,
      order: order.data,
      session: session.data
    });

  } catch (error) {
    console.log("Juspay Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};

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
      return_url: "https://dashboard.bookmyevent.ae/payment-status",
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



// const juspay = require("../../utils/juspayApi");
// const Booking = require("../../models/vendor/Booking");

// exports.createPaymentSession = async (req, res) => {
//   try {
//     const { bookingId } = req.body;

//     // 1️⃣ Validate booking
//     const booking = await Booking.findById(bookingId).populate("userId");
//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found" });
//     }

//     // 2️⃣ Juspay expects amount in PAISE
//     const amountInPaise = booking.finalPrice * 100;

//     // 3️⃣ Order creation
//     const orderPayload = {
//       order_id: "order_" + Date.now(),
//       amount: amountInPaise,
//       currency: "INR",
//       customer_id: booking.userId._id.toString(),
//       customer_email: booking.userId.email,
//       customer_phone: booking.userId.mobile || "9999999999",
//       description: "Booking Payment",
//       return_url: "https://dashboard.bookmyevent.ae/payment-status",
//       create_payment: true
//     };

//     const orderResponse = await juspay.post("/orders", orderPayload);

//     // 4️⃣ Create Juspay Session (Payment Page Link)
//     const sessionResponse = await juspay.post("/payment/session", {
//       order_id: orderPayload.order_id,
//       payment_page_client_id: "hdfcmaster",
//       action: "paymentPage"
//     });

//     return res.status(200).json({
//       success: true,
//       orderId: orderPayload.order_id,
//       payment_url: sessionResponse.data.payment_links.web
//     });

//   } catch (err) {
//     console.error("❌ Payment Error:", err.response?.data || err.message);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to create payment session",
//       error: err.response?.data || err.message
//     });
//   }
// };
