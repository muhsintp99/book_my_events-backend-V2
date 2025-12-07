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
    
    const orderResponse = await juspay.order.create({
      order_id: testOrderId,
      amount: 10000,
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
 * ✅ FIXED: Proper redirect configuration
 */
exports.createSmartGatewayPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    console.log("\n===================== PAYMENT DEBUG LOG =====================");

    // Fetch booking with venue populated
    const booking = await Booking.findById(bookingId)
      .populate("userId")
      .populate("venueId");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const advanceDeposit = booking.venueId?.advanceDeposit || 0;

    console.log("🔥 Venue Advance Deposit:", advanceDeposit);

    if (advanceDeposit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Venue does not have an advance deposit amount"
      });
    }

    const amountInRupees = Number(advanceDeposit).toFixed(2);
    console.log("🏦 FINAL ADVANCE AMOUNT SENT TO HDFC:", amountInRupees);

    const orderId = "order_" + Date.now();

    // ✅ OPTION 1: Direct to frontend (if HDFC allows)
    const returnUrl = `https://bookmyevent.ae/booking.html?status=success&bookingId=${bookingId}&orderId=${orderId}`;
    
    // ✅ OPTION 2: Via backend handler (more reliable)
    // const returnUrl = `${req.protocol}://${req.get('host')}/api/payment/payment-success?orderId=${orderId}&bookingId=${bookingId}`;
    
    console.log("🔗 Return URL:", returnUrl);

    // Create Juspay Order
    const orderResponse = await juspay.order.create({
      order_id: orderId,
      amount: amountInRupees,
      currency: "INR",
      customer_id: booking.userId._id.toString(),
      customer_email: booking.userId.email,
      customer_phone: booking.userId.mobile || "9999999999",
      description: `Advance Payment ₹${amountInRupees}`,
      return_url: returnUrl
    });

    console.log("✅ Order Created:", orderResponse.order_id);

    // ✅ Create Session with ALL redirect parameters
    const session = await juspay.orderSession.create({
      order_id: orderId,
      amount: amountInRupees,
      action: "paymentPage",
      payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
      currency: "INR",
      customer_id: booking.userId._id.toString(),
      customer_email: booking.userId.email,
      customer_phone: booking.userId.mobile || "9999999999",
      
      // ✅ ALL POSSIBLE RETURN URL PARAMETERS
      return_url: returnUrl,
      returnUrl: returnUrl,
      merchant_redirect_url: returnUrl,
      redirect_after_payment: true
    });

    console.log("✅ Session Created:", session.id);
    console.log("🎯 Payment Link:", session.payment_links?.web);

    // ✅ Store order ID in booking for later verification
    await Booking.findByIdAndUpdate(bookingId, {
      paymentOrderId: orderId
    });

    return res.json({
      success: true,
      order_id: orderId,
      advanceAmount: amountInRupees,
      payment_links: session.payment_links,
      sdk_payload: session.sdk_payload,
      return_url: returnUrl
    });

  } catch (error) {
    console.error("❌ Payment Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
};

/**
 * ✅ NEW: HANDLE PAYMENT SUCCESS (Backend redirect handler)
 * Use this if HDFC redirects to backend first
 */
exports.handlePaymentSuccess = async (req, res) => {
  try {
    const { orderId, bookingId } = req.query;
    
    console.log("🎉 Payment Success Handler Called");
    console.log("  - Order ID:", orderId);
    console.log("  - Booking ID:", bookingId);
    
    if (!orderId || !bookingId) {
      return res.redirect('https://bookmyevent.ae/booking.html?status=failed');
    }

    // Get order status from Juspay
    const order = await juspay.order.status(orderId);
    
    console.log("💳 Order Status:", order.status);

    // Update booking
    if (order.status === "CHARGED") {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: "completed",
        paymentOrderId: orderId,
        transactionId: order.txn_id || null,
        paidAmount: order.amount
      });
      
      console.log("✅ Booking updated successfully");
      
      // Redirect to frontend success page
      return res.redirect(
        `https://bookmyevent.ae/booking.html?status=success&bookingId=${bookingId}&orderId=${orderId}`
      );
    } else {
      return res.redirect(
        `https://bookmyevent.ae/booking.html?status=pending&bookingId=${bookingId}&orderId=${orderId}`
      );
    }

  } catch (error) {
    console.error("❌ Payment Success Handler Error:", error);
    return res.redirect('https://bookmyevent.ae/booking.html?status=failed');
  }
};

/**
 * ✅ VERIFY PAYMENT STATUS (Called by frontend after redirect)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, bookingId } = req.query;

    console.log("🔍 Verifying Payment:");
    console.log("  - orderId:", orderId);
    console.log("  - bookingId:", bookingId);

    if (!orderId || !bookingId) {
      return res.status(400).json({
        success: false,
        message: "Missing orderId or bookingId"
      });
    }

    // Get order status from Juspay
    const order = await juspay.order.status(orderId);
    
    console.log("💳 Juspay Order Status:", order.status);

    const paymentStatus = order.status;
    let bookingStatus = "pending";

    // Map Juspay status to booking status
    if (paymentStatus === "CHARGED") {
      bookingStatus = "completed";
    } else if (["PENDING", "PENDING_VBV", "AUTHORIZING", "NEW"].includes(paymentStatus)) {
      bookingStatus = "pending";
    } else {
      bookingStatus = "failed";
    }

    // Update booking in database
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        paymentStatus: bookingStatus,
        paymentOrderId: orderId,
        paidAmount: order.amount,
        transactionId: order.txn_id || null,
        paymentMethod: order.payment_method_type || "Unknown",
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    console.log("✅ Booking Updated:", updatedBooking._id);

    return res.json({
      success: bookingStatus === "completed",
      bookingId: updatedBooking._id,
      orderId: order.order_id,
      amount: order.amount,
      status: bookingStatus,
      paymentStatus: paymentStatus,
      transactionId: order.txn_id || null,
      message: bookingStatus === "completed" 
        ? "Payment successful" 
        : "Payment " + bookingStatus
    });

  } catch (error) {
    console.error("❌ Verification Error:", error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.response?.data || error.message
    });
  }
};

/**
 * HANDLE PAYMENT RESPONSE (S2S Callback - Optional)
 */
exports.handleJuspayResponse = async (req, res) => {
  try {
    const { orderId, bookingId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required"
      });
    }

    console.log("🔍 Checking Juspay order status:", orderId);

    const order = await juspay.order.status(orderId);
    const status = order.status;

    let bookingStatus = "pending";

    if (status === "CHARGED") bookingStatus = "completed";
    else if (["PENDING", "PENDING_VBV", "AUTHORIZING", "NEW"].includes(status)) bookingStatus = "pending";
    else bookingStatus = "failed";

    // Update booking in database
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: bookingStatus,
        paymentOrderId: orderId,
        paidAmount: order.amount,
        transactionId: order.txn_id || null
      });
    }

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

/**
 * CREATE SUBSCRIPTION PAYMENT
 */
exports.createSubscriptionPayment = async (req, res) => {
  try {
    const { providerId, planId, amount, customerEmail, customerPhone } = req.body;

    if (!providerId || !planId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: providerId, planId, amount"
      });
    }

    const orderId = "subscription_" + Date.now();
    const amountInPaise = amount;

    console.log("📝 Creating subscription payment order:", {
      orderId,
      amount: String(amountInPaise),
      providerId,
      planId
    });

    const returnUrl = `https://bookmyevent.ae/subscription-success.html?orderId=${orderId}&providerId=${providerId}`;

    // Create Order
    const orderResponse = await juspay.order.create({
      order_id: orderId,
      amount: String(amountInPaise),
      currency: "INR",
      customer_id: providerId,
      customer_email: customerEmail || "provider@bookmyevent.ae",
      customer_phone: customerPhone || "9999999999",
      description: `Subscription Payment - Plan ${planId}`,
      return_url: returnUrl,
      metadata: {
        providerId: providerId,
        planId: planId,
        type: "subscription"
      }
    });

    console.log("✅ Order created:", orderResponse);

    // Create Session
    const session = await juspay.orderSession.create({
      order_id: orderId,
      amount: String(amountInPaise),
      action: "paymentPage",
      payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
      return_url: returnUrl,
      returnUrl: returnUrl,
      merchant_redirect_url: returnUrl,
      redirect_after_payment: true,
      currency: "INR",
      customer_id: providerId,
      customer_email: customerEmail || "provider@bookmyevent.ae",
      customer_phone: customerPhone || "9999999999"
    });

    console.log("✅ Payment session created:", session);

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