const { Juspay, APIError } = require("expresscheckout-nodejs");
const Booking = require("../models/vendor/Booking");
const config = require("../config/smartgateway_config.json");
const Subscription = require("../models/admin/Subscription");
const Plan = require("../models/admin/Plan");

// Initialize SmartGateway with BASIC Authentication (API Key)
const juspay = new Juspay({
  merchantId: config.MERCHANT_ID,
  baseUrl: config.BASE_URL,
  apiKey: config.API_KEY,
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
      description: "Test Order",
    });

    console.log("✅ Test order created successfully:", orderResponse);

    return res.json({
      success: true,
      message: "SDK is working correctly",
      order: orderResponse,
    });
  } catch (error) {
    console.error("❌ SDK Test Failed:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

/**
 * CREATE PAYMENT SESSION (SmartGateway Payment Page)
 */
exports.createSmartGatewayPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    console.log("\n===================== PAYMENT DEBUG LOG =====================");

    // Fetch booking with module info
    const booking = await Booking.findById(bookingId)
      .populate("userId")
      .populate("venueId")
      .populate("makeupId")
      .populate("moduleId")
      .populate("photographyId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const moduleType = booking.moduleType;
    console.log("📌 Module Type:", moduleType);

    // Get advance amount
    let advanceAmount = Number(booking.advanceAmount) || 0;
    console.log("🔥 advanceAmount from Booking:", advanceAmount);

    // Fallback logic
    if (advanceAmount <= 0) {
      console.log("⚠️ advanceAmount missing — applying fallback logic");

      if (moduleType === "Venues") {
        advanceAmount = Number(booking.venueId?.advanceDeposit) || 0;
      } else if (moduleType === "Makeup" || moduleType === "Makeup Artist") {
        advanceAmount = Number(booking.makeupId?.advanceBookingAmount) || 0;
      } else if (moduleType === "Photography") {
        advanceAmount = Number(booking.photographyId?.advanceBookingAmount || 0);
      } else {
        advanceAmount = Number(booking.serviceProvider?.advanceBookingAmount) || 0;
      }
    }

    console.log("✅ Final Computed Advance Amount:", advanceAmount);

    if (advanceAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: `No advance amount configured for ${moduleType}`,
      });
    }

    const amountInRupees = advanceAmount.toFixed(2);
    console.log("🏦 FINAL AMOUNT SENT TO HDFC:", amountInRupees);

    const orderId = "order_" + Date.now();
    
    // ✅ FIX: Construct return URL ONCE
    const returnUrl = `https://bookmyevent.ae/booking.html?status=success&bookingId=${bookingId}`;
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
      return_url: returnUrl, // ✅ ADD RETURN URL HERE
    });

    console.log("✅ Order created:", orderResponse);

    // ✅ FIX: Create Payment Session with proper configuration
    const session = await juspay.orderSession.create({
      order_id: orderId,
      action: "paymentPage",
      amount: amountInRupees,
      currency: "INR",
      customer_id: booking.userId._id.toString(),
      customer_email: booking.userId.email,
      customer_phone: booking.userId.mobile || "9999999999",
      payment_page_client_id: "hdfcmaster",
      return_url: returnUrl, // ✅ SAME RETURN URL
      redirect: true, // ✅ ENABLE AUTO-REDIRECT
      auto_redirect: true, // ✅ Additional flag for some gateways
      description: `Advance Payment ₹${amountInRupees}`,
      first_name: booking.userId.firstName || "",
      last_name: booking.userId.lastName || "",
      metadata: {
        bookingId: bookingId,
        moduleType: "Venues"
      }
    });

    console.log("🎯 Payment Page:", session.payment_links?.web);
    console.log("🔗 Session Return URL:", session.return_url);

    // Clean SDK Payload (remove returnUrl to avoid confusion)
    const sdkPayload = JSON.parse(JSON.stringify(session.sdk_payload));
    if (sdkPayload?.payload?.returnUrl) {
      console.log("⚠️ Removing returnUrl from SDK payload");
      delete sdkPayload.payload.returnUrl;
    }

    // ✅ FIX: Return consistent response
    return res.json({
      success: true,
      order_id: orderId,
      advanceAmount: amountInRupees,
      payment_links: session.payment_links,
      sdk_payload: sdkPayload,
      return_url: returnUrl, // ✅ SAME RETURN URL IN RESPONSE
    });

  } catch (error) {
    console.error("❌ Payment Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message,
    });
  }
};

/**
 * JUSPAY WEBHOOK HANDLER
 */
exports.juspayWebhook = async (req, res) => {
  try {
    console.log("🔔 JUSPAY WEBHOOK:", req.body);

    const { order_id, status } = req.body;
    if (!order_id) return res.sendStatus(200);

    // Find subscription by paymentId
    const subscription = await Subscription.findOne({ paymentId: order_id });

    if (!subscription) return res.sendStatus(200);

    if (status === "CHARGED") {
      const plan = await Plan.findById(subscription.planId);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationInDays);

      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.status = "active";

      await subscription.save();
    }

    if (status === "FAILED") {
      subscription.status = "cancelled";
      await subscription.save();
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ WEBHOOK ERROR:", err);
    return res.sendStatus(200);
  }
};

/**
 * CREATE PAYMENT SESSION FOR SUBSCRIPTION
 */
exports.createSubscriptionPayment = async (req, res) => {
  try {
    const { providerId, planId, amount, customerEmail, customerPhone } = req.body;

    if (!providerId || !planId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    const orderId = "subscription_" + Date.now();
    const amountInRupees = Number(amount).toFixed(2);
    
    // ✅ FIX: Construct return URL
    const returnUrl = `https://www.bookmyevent.ae/subscription-status.html?status=success&providerId=${providerId}`;

    // Create pending subscription
    await Subscription.create({
      userId: providerId,
      planId: plan._id,
      moduleId: plan.moduleId,
      startDate: new Date(),
      endDate: new Date(),
      paymentId: orderId,
      status: "trial"
    });

    // Create Juspay Order
    await juspay.order.create({
      order_id: orderId,
      amount: amountInRupees,
      currency: "INR",
      customer_id: providerId,
      customer_email: customerEmail,
      customer_phone: customerPhone || "9999999999",
      description: `Subscription Payment - ${plan.name}`,
      return_url: returnUrl, // ✅ ADD RETURN URL
    });

    // Create Payment Session
    const session = await juspay.orderSession.create({
      order_id: orderId,
      amount: amountInRupees,
      action: "paymentPage",
      payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
      customer_id: providerId,
      customer_email: customerEmail,
      customer_phone: customerPhone || "9999999999",
      return_url: returnUrl, // ✅ SAME RETURN URL
      redirect: true, // ✅ ENABLE AUTO-REDIRECT
    });

    return res.json({
      success: true,
      order_id: orderId,
      payment_links: session.payment_links,
      return_url: returnUrl, // ✅ CONSISTENT RETURN URL
    });

  } catch (error) {
    console.error("❌ Subscription payment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * HANDLE PAYMENT RESPONSE (S2S Order Status Check)
 */
exports.handleJuspayResponse = async (req, res) => {
  try {
    const { orderId, bookingId } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    // Get status from Juspay
    const order = await juspay.order.status(orderId);
    const status = order.status;

    let bookingStatus = "pending";

    if (status === "CHARGED") bookingStatus = "completed";
    else if (["PENDING", "PENDING_VBV", "AUTHORIZING", "NEW"].includes(status))
      bookingStatus = "pending";
    else bookingStatus = "failed";

    // Update booking in database
    if (bookingId) {
      await Booking.findByIdAndUpdate(bookingId, {
        paymentStatus: bookingStatus,
        paymentOrderId: orderId,
        paidAmount: order.amount,
      });
    }

    return res.json({
      success: bookingStatus === "completed",
      orderId: order.order_id,
      amount: order.amount,
      status: bookingStatus,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error checking payment status",
    });
  }
};