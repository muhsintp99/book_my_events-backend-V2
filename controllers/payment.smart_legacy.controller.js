// const crypto = require("crypto");
// const Booking = require("../models/vendor/Booking");
// const config = require("../config/smartgateway_config.json");

// // ✅ Generate HDFC SmartGateway Signature Correctly
// function generateSignature(requestData, key) {
//   // Required concatenation order (HDFC Rules)
//   const dataString =
//     requestData.merchantId +
//     requestData.amount +
//     requestData.currency +
//     requestData.merchantTxnId +
//     requestData.redirectUrl +
//     requestData.paymentPageClientId +
//     requestData.customerEmail +
//     requestData.customerMobile;

//   return crypto
//     .createHmac("sha256", key)
//     .update(dataString)
//     .digest("base64");
// }

// exports.createOrderLegacy = async (req, res) => {
//   try {
//     const { bookingId } = req.body;

//     const booking = await Booking.findById(bookingId).populate("userId");

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found"
//       });
//     }

//     // Convert amount to string exactly as HDFC expects
//     const amount = booking.finalPrice.toString();

//     // REQUIRED FIELDS (STRICT ORDER)
//     const requestData = {
//       merchantId: config.MERCHANT_ID,
//       amount: amount,
//       currency: "INR",
//       merchantTxnId: "MTX_" + Date.now(),
//       redirectUrl: "https://dashboard.bookmyevent.ae/payment-success",
//       paymentPageClientId: config.PAYMENT_PAGE_CLIENT_ID,
//       customerEmail: booking.userId.email,
//       customerMobile: booking.userId.mobile || "0000000000",
//     };

//     // Generate VALID HDFC signature
//     const signature = generateSignature(requestData, config.API_KEY);

//     // Build the full payment payload sent to frontend
//     const paymentPayload = {
//       ...requestData,
//       signature,
//       actionUrl: `${config.BASE_URL}/paymentpage/merchant/v1/pay`,
//     };

//     console.log("🔍 Sending Payment Payload to Frontend:", paymentPayload);

//     return res.json({
//       success: true,
//       payment_form: paymentPayload,
//     });

//   } catch (err) {
//     console.error("❌ Legacy PG Error:", err.message);
//     return res.status(500).json({
//       success: false,
//       message: "Order creation failed",
//       error: err.message,
//     });
//   }
// };



// const crypto = require("crypto");
// const Booking = require("../models/vendor/Booking");
// const config = require("../config/smartgateway_config.json");
// const { Juspay } = require("expresscheckout-nodejs");

// const juspay = new Juspay({
//   merchantId: config.MERCHANT_ID,
//   apiKey: config.API_KEY,
//   baseUrl: config.BASE_URL
// });

// // Legacy signature generator (still OK)
// function generateSignature(requestData, key) {
//   const dataString =
//     requestData.merchantId +
//     requestData.amount +
//     requestData.currency +
//     requestData.merchantTxnId +
//     requestData.redirectUrl +
//     requestData.paymentPageClientId +
//     requestData.customerEmail +
//     requestData.customerMobile;

//   return crypto
//     .createHmac("sha256", key)
//     .update(dataString)
//     .digest("base64");
// }

// exports.createOrderLegacy = async (req, res) => {
//   try {
//     const { bookingId } = req.body;

//     const booking = await Booking.findById(bookingId).populate("userId");

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found"
//       });
//     }

//     const amount = booking.finalPrice.toString();
//     const merchantTxnId = "MTX_" + Date.now();

//     const requestData = {
//       merchantId: config.MERCHANT_ID,
//       amount,
//       currency: "INR",
//       merchantTxnId,
//       redirectUrl: "https://dashboard.bookmyevent.ae/payment-success",
//       paymentPageClientId: config.PAYMENT_PAGE_CLIENT_ID,
//       customerEmail: booking.userId.email,
//       customerMobile: booking.userId.mobile || "0000000000",
//     };

//     const signature = generateSignature(requestData, config.API_KEY);

//     // ⭐ Create SmartGateway Order
//     await juspay.order.create({
//       order_id: merchantTxnId,
//       amount: amount * 100,
//       currency: "INR",
//       customer_email: requestData.customerEmail,
//       customer_phone: requestData.customerMobile,
//     });

//     // ⭐ Create SmartGateway Session (REAL PAYMENT LINK)
//     const session = await juspay.orderSession.create({
//       order_id: merchantTxnId,
//       amount: amount * 100,
//       currency: "INR",
//       action: "paymentPage",
//       payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
//       return_url: requestData.redirectUrl,
//     });

//     return res.json({
//       success: true,
//       payment_url: session.payment_links.web, // ⭐ NO FORM URL
//       signature,
//       merchantTxnId
//     });

//   } catch (err) {
//     console.error("❌ Legacy PG Error:", err.response?.data || err.message);
//     return res.status(500).json({
//       success: false,
//       message: "Order creation failed",
//       error: err.response?.data || err.message,
//     });
//   }
// };


const { Juspay, APIError } = require("expresscheckout-nodejs");
const Booking = require("../models/vendor/Booking");
const config = require("../config/smartgateway_config.json");


// Initialize SmartGateway with BASIC Authentication (API Key)
const juspay = new Juspay({
  merchantId: config.MERCHANT_ID,
  baseUrl: config.BASE_URL,
  apiKey: config.API_KEY
});

console.log("✅ Juspay SDK initialized with BASIC Auth");
console.log("   Merchant ID:", config.MERCHANT_ID);
console.log("   Base URL:", config.BASE_URL);

/**
 * TEST SDK CONNECTION
 */
exports.testConnection = async (req, res) => {
  try {
    const testOrderId = "test_order_" + Date.now();
    
    console.log("🧪 Testing SDK with order:", testOrderId);
    
    // Simple order creation test
    const orderResponse = await juspay.order.create({
      order_id: testOrderId,
      amount: 10000, // 100 INR
      currency: "INR",
      customer_id: "test_customer_123",
      customer_email: "test@example.com",
      customer_phone: "9999999999",
      description: "Test Order"
    });

    console.log("✅ Test order created successfully:", orderResponse);

    return res.json({
      success: true,
      message: "SDK is working correctly",
      order: orderResponse
    });

  } catch (error) {
    console.error("❌ SDK Test Failed:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};

/**
 * CREATE PAYMENT SESSION (SmartGateway Payment Page)
 */
exports.createSmartGatewayPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("userId");
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const orderId = "order_" + Date.now();

    // ✔ Get advance deposit (Payable Now)
    const advanceAmount = booking.advanceDepositAmount || 0;

    if (advanceAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Advance deposit amount is zero, nothing to charge"
      });
    }

    // Convert to paise
    const amountInPaise = Math.round(advanceAmount * 100);

    console.log("💰 Creating order with ADVANCE ONLY:", {
      finalPrice: booking.finalPrice,
      advanceAmount,
      amountInPaise
    });

    // Create order
    const orderResponse = await juspay.order.create({
      order_id: orderId,
      amount: amountInPaise,
      currency: "INR",
      customer_id: booking.userId._id.toString(),
      customer_email: booking.userId.email,
      customer_phone: booking.userId.mobile || "9999999999",
      description: `Advance Payment ₹${advanceAmount}`
    });

    // Create payment page session
    const session = await juspay.orderSession.create({
      order_id: orderId,
      amount: amountInPaise,
      action: "paymentPage",
      payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
      return_url: `https://vendor.bookmyevent.ae/bookings/all?orderId=${orderId}&bookingId=${bookingId}`,
      currency: "INR",
      customer_id: booking.userId._id.toString(),
      customer_email: booking.userId.email,
      customer_phone: booking.userId.mobile || "9999999999"
    });

    return res.json({
      success: true,
      order_id: orderId,
      advanceAmount,
      payment_links: session.payment_links,
      sdk_payload: session.sdk_payload
    });

  } catch (error) {
    console.error("❌ SmartGateway Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};

// Add this to your payment.smart_legacy.controller.js

/**
 * CREATE PAYMENT SESSION FOR SUBSCRIPTION
 */
exports.createSubscriptionPayment = async (req, res) => {
  try {
    const { providerId, planId, amount, customerEmail, customerPhone } = req.body;

    // Validate inputs
    if (!providerId || !planId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: providerId, planId, amount"
      });
    }

    const orderId = "subscription_" + Date.now();
    // const amountInPaise = Math.round(amount * 100); 
    const amountInPaise = amount;  


    console.log("📝 Creating subscription payment order:", {
      orderId,
      amount: amountInPaise,
      providerId,
      planId
    });

    // 1️⃣ Create Order
    const orderResponse = await juspay.order.create({
      order_id: orderId,
      amount: amountInPaise,
      currency: "INR",
      customer_id: providerId,
      customer_email: customerEmail || "provider@bookmyevent.ae",
      customer_phone: customerPhone || "9999999999",
      description: `Subscription Payment - Plan ${planId}`,
      metadata: {
        providerId: providerId,
        planId: planId,
        type: "subscription"
      }
    });

    console.log("✅ Order created:", orderResponse);

    // 2️⃣ Create Session → Payment Page URL
    const session = await juspay.orderSession.create({
      order_id: orderId,
      amount: amountInPaise,
      action: "paymentPage",
      payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
      // return_url: "https://dashboard.bookmyevent.ae/payment-status",
      return_url: `https://vendor.bookmyevent.ae/bookings/all?orderId=${orderId}`,

      currency: "INR",
      customer_id: providerId,
      customer_email: customerEmail || "provider@bookmyevent.ae",
      customer_phone: customerPhone || "9999999999"
    });

    console.log("✅ Payment session created:", session);

    // Return response with payment link
    return res.json({
      success: true,
      status: session.status,
      id: session.id,
      order_id: session.order_id,
      payment_links: {
        web: session.payment_links?.web || session.payment_links,
        expiry: session.payment_links?.expiry
      },
      sdk_payload: session.sdk_payload
    });

  } catch (error) {
    console.error("❌ Subscription Payment Error:", error);
    console.error("❌ Error details:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
      details: error.toString()
    });
  }
};


/**
 * HANDLE PAYMENT RESPONSE (S2S Order Status Check)
 */
// exports.handleJuspayResponse = async (req, res) => {
//   try {
//     const { orderId } = req.query;

//     if (!orderId) {
//       return res.status(400).json({
//         success: false,
//         message: "orderId is required"
//       });
//     }

//     console.log("🔍 Checking Juspay order status:", orderId);

//     // 1️⃣ Fetch order status from Juspay
//     const statusResponse = await juspay.order.status(orderId);

//     console.log("💳 Order Status Response:", statusResponse);

//     const status = statusResponse.status;

//     // 2️⃣ Handle based on status
//     if (status === "CHARGED") {
//       console.log("✅ Payment successful for:", orderId);

//       // TODO: Update your DB booking/subscription here

//       return res.json({
//         success: true,
//         status: "success",
//         order: statusResponse
//       });
//     }

//     if (status === "PENDING_VBV" || status === "AUTHORIZING" || status === "PENDING") {
//       console.log("⏳ Payment still pending:", orderId);

//       return res.json({
//         success: true,
//         status: "pending",
//         order: statusResponse
//       });
//     }

//     console.log("❌ Payment failed:", orderId);

//     return res.json({
//       success: false,
//       status: "failed",
//       order: statusResponse
//     });

//   } catch (error) {
//     console.error("❌ Error checking order status:", error.response?.data || error.message);

//     return res.status(500).json({
//       success: false,
//       message: "Error checking order status",
//       error: error.response?.data || error.message
//     });
//   }
// };



exports.handleJuspayResponse = async (req, res) => {
  try {
    const { orderId, bookingId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required"
      });
    }

    // Get status from Juspay
    const order = await juspay.order.status(orderId);
    const status = order.status;

    let bookingStatus = "pending";

    if (status === "CHARGED") bookingStatus = "completed";
    else if (["PENDING", "PENDING_VBV", "AUTHORIZING", "NEW"].includes(status)) bookingStatus = "pending";
    else bookingStatus = "failed";

    // 🔥 Update booking in database
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: bookingStatus,
        paymentOrderId: orderId,
        paidAmount: order.amount
      });
    }

    // Send clean response
    return res.json({
      success: bookingStatus === "completed",
      orderId: order.order_id,
      amount: order.amount,
      status: bookingStatus
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking payment status"
    });
  }
};
