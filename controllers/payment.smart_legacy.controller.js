// const { Juspay, APIError } = require("expresscheckout-nodejs");
// const Booking = require("../models/vendor/Booking");
// const config = require("../config/smartgateway_config.json");
// const Subscription = require("../models/admin/Subscription");
// const Plan = require("../models/admin/Plan");

// // Initialize SmartGateway with BASIC Authentication (API Key)
// const juspay = new Juspay({
//   merchantId: config.MERCHANT_ID,
//   baseUrl: config.BASE_URL,
//   apiKey: config.API_KEY,
// });

// console.log("✅ Juspay SDK initialized with BASIC Auth");
// console.log("   Merchant ID:", config.MERCHANT_ID);
// console.log("   Base URL:", config.BASE_URL);

// /**
//  * TEST SDK CONNECTION
//  */
// exports.testConnection = async (req, res) => {
//   try {
//     const testOrderId = "test_order_" + Date.now();

//     console.log("🧪 Testing SDK with order:", testOrderId);

//     // Simple order creation test
//     const orderResponse = await juspay.order.create({
//       order_id: testOrderId,
//       amount: 10000, // 100 INR
//       currency: "INR",
//       customer_id: "test_customer_123",
//       customer_email: "test@example.com",
//       customer_phone: "9999999999",
//       description: "Test Order",
//     });

//     console.log("✅ Test order created successfully:", orderResponse);

//     return res.json({
//       success: true,
//       message: "SDK is working correctly",
//       order: orderResponse,
//     });
//   } catch (error) {
//     console.error("❌ SDK Test Failed:", error.response?.data || error.message);
//     return res.status(500).json({
//       success: false,
//       error: error.response?.data || error.message,
//     });
//   }
// };

// /**
//  * CREATE PAYMENT SESSION (SmartGateway Payment Page)
//  */
// exports.createSmartGatewayPayment = async (req, res) => {
//   try {
//     const { bookingId } = req.body;

//     console.log("\n===================== PAYMENT DEBUG LOG =====================");

//     // Fetch booking with module info
//     const booking = await Booking.findById(bookingId)
//       .populate("userId")
//       .populate("venueId")
//       .populate("makeupId")
//       .populate("moduleId")
//       .populate("photographyId")

//     if (!booking) {
//       return res.status(404).json({
//         success: false,
//         message: "Booking not found",
//       });
//     }

//     const moduleType = booking.moduleType;
//     console.log("📌 Module Type:", moduleType);

//     // -----------------------------
//     // 1️⃣ READ advanceAmount from booking (new logic)
//     // -----------------------------
//     let advanceAmount = Number(booking.advanceAmount) || 0;

//     console.log("🔥 advanceAmount from Booking:", advanceAmount);

//     // -----------------------------
//     // 2️⃣ FALLBACK LOGIC (for old bookings that don't have advanceAmount)
//     // -----------------------------
//    if (advanceAmount <= 0) {
//   console.log("⚠️ advanceAmount missing — applying fallback logic");

//   if (moduleType === "Venues") {
//     advanceAmount = Number(booking.venueId?.advanceDeposit) || 0;
//   }
//   else if (moduleType === "Makeup" || moduleType === "Makeup Artist") {
//     advanceAmount = Number(booking.makeupId?.advanceBookingAmount) || 0;
//   }
//   else if (moduleType === "Photography") {
// advanceAmount = Number(booking.photographyId?.advanceBookingAmount || 0);
//   }
//   else {
//     advanceAmount = Number(booking.serviceProvider?.advanceBookingAmount) || 0;
//   }
// }

//     console.log("✅ Final Computed Advance Amount:", advanceAmount);

//     // -----------------------------
//     // 3️⃣ Validate advance amount
//     // -----------------------------
//     if (advanceAmount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: `No advance amount configured for ${moduleType}`,
//       });
//     }

//     const amountInRupees = advanceAmount.toFixed(2);
//     console.log("🏦 FINAL AMOUNT SENT TO HDFC:", amountInRupees);

//     const orderId = "order_" + Date.now();

//     // -----------------------------
//     // 4️⃣ Create Juspay Order
//     // -----------------------------
//     const orderResponse = await juspay.order.create({
//       order_id: orderId,
//       amount: amountInRupees,
//       currency: "INR",
//       customer_id: booking.userId._id.toString(),
//       customer_email: booking.userId.email,
//       customer_phone: booking.userId.mobile || "9999999999",
//       description: `Advance Payment ₹${amountInRupees}`,
//     });

//     // -----------------------------
//     // 5️⃣ Create Payment Session
//     // -----------------------------
//     const session = await juspay.orderSession.create({
//       order_id: orderId,
//       action: "paymentPage",
//       amount: amountInRupees,
//       customer_id: booking.userId._id.toString(),
//       customer_email: booking.userId.email,
//       customer_phone: booking.userId.mobile || "9999999999",
//       payment_page_client_id: "hdfcmaster",
//       return_url: `https://bookmyevent.ae/booking.html?status=success&bookingId=${bookingId}`,
//       redirect:true,
//       description: `Advance Payment ${amountInRupees}`,
//       first_name: booking.userId.firstName || "",
//       last_name: booking.userId.lastName || "",
//     });

//     console.log("🎯 Payment Page:", session.payment_links?.web);

//     // -----------------------------
//     // 6️⃣ Clean SDK Payload
//     // -----------------------------
//     const sdkPayload = JSON.parse(JSON.stringify(session.sdk_payload));
//     if (sdkPayload?.payload?.returnUrl) {
//       delete sdkPayload.payload.returnUrl;
//     }

//     // -----------------------------
//     // 7️⃣ Final Response
//     // -----------------------------
//     return res.json({
//       success: true,
//       order_id: orderId,
//       advanceAmount: amountInRupees,
//       payment_links: session.payment_links,
//       sdk_payload: sdkPayload,
//       return_url: `https://bookmyevent.ae/booking.html?status=success&bookingId=${bookingId}`,
//     });

//   } catch (error) {
//     console.error("❌ Payment Error:", error.response?.data || error.message);
//     return res.status(500).json({
//       success: false,
//       error: error.response?.data || error.message,
//     });
//   }
// };

// exports.juspayWebhook = async (req, res) => {
//   try {
//     console.log("🔔 JUSPAY WEBHOOK:", req.body);

//     const { order_id, status } = req.body;
//     if (!order_id) return res.sendStatus(200);

//     // 🔍 Find subscription by paymentId
//     const subscription = await Subscription.findOne({ paymentId: order_id });

//     if (!subscription) return res.sendStatus(200);

//     if (status === "CHARGED") {
//       const plan = await Plan.findById(subscription.planId);

//       const startDate = new Date();
//       const endDate = new Date();
//       endDate.setDate(endDate.getDate() + plan.durationInDays);

//       subscription.startDate = startDate;
//       subscription.endDate = endDate;
//       subscription.status = "active";

//       await subscription.save();
//     }

//     if (status === "FAILED") {
//       subscription.status = "cancelled";
//       await subscription.save();
//     }

//     return res.sendStatus(200);
//   } catch (err) {
//     console.error("❌ WEBHOOK ERROR:", err);
//     return res.sendStatus(200);
//   }
// };

// /**
//  * CREATE PAYMENT SESSION FOR SUBSCRIPTION
//  */
// // exports.createSubscriptionPayment = async (req, res) => {
// //   try {
// //     const { providerId, planId, amount, customerEmail, customerPhone } = req.body;

// //     // Validate inputs
// //     if (!providerId || !planId || !amount) {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Missing required fields: providerId, planId, amount",
// //       });
// //     }

// //     const orderId = "subscription_" + Date.now();
// //     const amountInRupees = Number(amount).toFixed(2);

// //     console.log("📝 Creating subscription payment order:", {
// //       orderId,
// //       amount: amountInRupees,
// //       providerId,
// //       planId,
// //     });

// //     // 1️⃣ Create Order
// //     const orderResponse = await juspay.order.create({
// //       order_id: orderId,
// //       amount: amountInRupees,
// //       currency: "INR",
// //       customer_id: providerId,
// //       customer_email: customerEmail || "provider@bookmyevent.ae",
// //       customer_phone: customerPhone || "9999999999",
// //       description: `Subscription Payment - Plan ${planId}`,
// //       metadata: {
// //         providerId,
// //         planId,
// //         type: "subscription",
// //       },
// //     });

// //     console.log("✅ Order created:", orderResponse);

// //     // 2️⃣ Create Session → Payment Page URL
// //     const session = await juspay.orderSession.create({
// //       order_id: orderId,
// //       amount: amountInRupees,
// //       action: "paymentPage",
// //       payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
// //       return_url: `https://www.bookmyevent.ae/subscription-status.html?status=success&providerId=${providerId}`,
// //       currency: "INR",
// //       customer_id: providerId,
// //       customer_email: customerEmail || "provider@bookmyevent.ae",
// //       customer_phone: customerPhone || "9999999999",
// //     });

// //     console.log("✅ Payment session created:", session);

// //     // ⭐ Clone sdk_payload and remove returnUrl from payload
// //     const sdkPayload = JSON.parse(JSON.stringify(session.sdk_payload));
// //     if (sdkPayload?.payload?.returnUrl) {
// //       delete sdkPayload.payload.returnUrl;
// //     }

// //     return res.json({
// //       success: true,
// //       order_id: session.order_id,
// //       status: session.status,
// //       payment_links: {
// //         web: session.payment_links?.web,
// //         expiry: session.payment_links?.expiry,
// //       },
// //       sdk_payload: sdkPayload, // ⭐ Modified payload without returnUrl
// //       return_url: `https://www.bookmyevent.ae/subscription-status.html?status=success&providerId=${providerId}`
// //     });

// //   } catch (error) {
// //     console.error("❌ Subscription Payment Error:", error);
// //     console.error("❌ Error details:", error.response?.data || error.message);

// //     return res.status(500).json({
// //       success: false,
// //       error: error.response?.data || error.message,
// //     });
// //   }
// // };

// exports.createSubscriptionPayment = async (req, res) => {
//   try {
//     const { providerId, planId, amount, customerEmail, customerPhone } = req.body;

//     if (!providerId || !planId || !amount) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields"
//       });
//     }

//     // ✅ 1️⃣ Get plan
//     const plan = await Plan.findById(planId);
//     if (!plan) {
//       return res.status(404).json({
//         success: false,
//         message: "Plan not found"
//       });
//     }

//     const orderId = "subscription_" + Date.now();
//     const amountInRupees = Number(amount).toFixed(2);

//     // ✅ 2️⃣ CREATE PENDING SUBSCRIPTION (CRITICAL)
//     await Subscription.create({
//       userId: providerId,
//       planId: plan._id,
//       moduleId: plan.moduleId,
//       startDate: new Date(),        // temp
//       endDate: new Date(),          // temp
//       paymentId: orderId,           // 🔥 LINK TO PAYMENT
//       status: "trial"               // 🔥 NOT ACTIVE YET
//     });

//     // ✅ 3️⃣ Create Juspay Order
//     await juspay.order.create({
//       order_id: orderId,
//       amount: amountInRupees,
//       currency: "INR",
//       customer_id: providerId,
//       customer_email: customerEmail,
//       customer_phone: customerPhone || "9999999999",
//       description: `Subscription Payment - ${plan.name}`
//     });

//     // ✅ 4️⃣ Create Payment Session
//     const session = await juspay.orderSession.create({
//       order_id: orderId,
//       amount: amountInRupees,
//       action: "paymentPage",
//       payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
//       customer_id: providerId,
//       customer_email: customerEmail,
//       customer_phone: customerPhone || "9999999999",
//       return_url: `https://www.bookmyevent.ae/subscription-status.html`,
//             redirect:true,

//     });

//     return res.json({
//       success: true,
//       order_id: orderId,
//       payment_links: session.payment_links
//     });

//   } catch (error) {
//     console.error("❌ Subscription payment error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

// /**
//  * HANDLE PAYMENT RESPONSE (S2S Order Status Check)
//  */
// exports.handleJuspayResponse = async (req, res) => {
//   try {
//     const { orderId, bookingId } = req.query;

//     if (!orderId) {
//       return res.status(400).json({
//         success: false,
//         message: "orderId is required",
//       });
//     }

//     // Get status from Juspay
//     const order = await juspay.order.status(orderId);
//     const status = order.status;

//     let bookingStatus = "pending";

//     if (status === "CHARGED") bookingStatus = "completed";
//     else if (["PENDING", "PENDING_VBV", "AUTHORIZING", "NEW"].includes(status))
//       bookingStatus = "pending";
//     else bookingStatus = "failed";

//     // 🔥 Update booking in database
//     if (bookingId) {
//       await Booking.findByIdAndUpdate(bookingId, {
//         paymentStatus: bookingStatus,
//         paymentOrderId: orderId,
//         paidAmount: order.amount,
//       });
//     }

//     // Send clean response
//     return res.json({
//       success: bookingStatus === "completed",
//       orderId: order.order_id,
//       amount: order.amount,
//       status: bookingStatus,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Error checking payment status",
//     });
//   }
// };

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

    console.log(
      "\n===================== PAYMENT DEBUG LOG ====================="
    );

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
        advanceAmount = Number(
          booking.photographyId?.advanceBookingAmount || 0
        );
      } else {
        advanceAmount =
          Number(booking.serviceProvider?.advanceBookingAmount) || 0;
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
    // const returnUrl = `https://bookmyevent.ae/booking.html?status=success&bookingId=${bookingId}`;
    const returnUrl = `https://bookmyevent.ae/payment-success/index.html?bookingId=${bookingId}`;

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
        moduleType: "Venues",
      },
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

      await Subscription.updateMany(
        {
          userId: subscription.userId,
          moduleId: subscription.moduleId,
          _id: { $ne: subscription._id },
        },
        { status: "cancelled", isCurrent: false }
      );

      subscription.status = "active";
      subscription.startDate = new Date();
      subscription.endDate = new Date(
        Date.now() + plan.durationInDays * 24 * 60 * 60 * 1000
      );
      subscription.isCurrent = true;

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
// exports.createSubscriptionPayment = async (req, res) => {
//   try {
//     const { providerId, planId, amount, customerEmail, customerPhone } = req.body;

//     if (!providerId || !planId || !amount) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields"
//       });
//     }

//     const plan = await Plan.findById(planId);
//     if (!plan) {
//       return res.status(404).json({
//         success: false,
//         message: "Plan not found"
//       });
//     }

//     const orderId = "subscription_" + Date.now();
//     const amountInRupees = Number(amount).toFixed(2);

//     // ✅ FIX: Construct return URL
// const returnUrl =
//   `https://vendor.bookmyevent.ae/makeupartist/upgrade?order_id=${orderId}`;

//     // Create pending subscription
//     await Subscription.create({
//       userId: providerId,
//       planId: plan._id,
//       moduleId: plan.moduleId,
//       startDate: new Date(),
//       endDate: new Date(),
//       paymentId: orderId,
//       status: "trial"
//     });

//     // Create Juspay Order
//     await juspay.order.create({
//       order_id: orderId,
//       amount: amountInRupees,
//       currency: "INR",
//       customer_id: providerId,
//       customer_email: customerEmail,
//       customer_phone: customerPhone || "9999999999",
//       description: `Subscription Payment - ${plan.name}`,
//       return_url: returnUrl, // ✅ ADD RETURN URL
//     });

//     // Create Payment Session
//     const session = await juspay.orderSession.create({
//       order_id: orderId,
//       amount: amountInRupees,
//       action: "paymentPage",
//       payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
//       customer_id: providerId,
//       customer_email: customerEmail,
//       customer_phone: customerPhone || "9999999999",
//       return_url: returnUrl, // ✅ SAME RETURN URL
//       redirect: true, // ✅ ENABLE AUTO-REDIRECT
//         analytics: false

//     });

//     return res.json({
//       success: true,
//       order_id: orderId,
//       payment_links: session.payment_links,
//       return_url: returnUrl, // ✅ CONSISTENT RETURN URL
//     });

//   } catch (error) {
//     console.error("❌ Subscription payment error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
exports.createSubscriptionPayment = async (req, res) => {
  try {
    const { providerId, planId, customerEmail, customerPhone } = req.body;

    console.log("📥 Payment request:", {
      providerId,
      planId,
      customerEmail,
      customerPhone,
    });

    if (!providerId || !planId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: providerId and planId",
      });
    }

    // Get plan details
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    console.log("📋 Plan found:", {
      name: plan.name,
      price: plan.price,
      moduleId: plan.moduleId,
    });

    const orderId = "subscription_" + Date.now();
    const amountInRupees = Number(plan.price).toFixed(2);

    // Return URL with orderId
    const returnUrl = `https://vendor.bookmyevent.ae/makeupartist/upgrade?orderId=${orderId}`;

    // const returnUrl = `  https://bookmyevent.ae/payment-success/index.html?orderId=${orderId};`;

    console.log("🔗 Return URL:", returnUrl);

    // 1️⃣ Create pending subscription FIRST
    const newSubscription = await Subscription.create({
      userId: providerId,
      planId: plan._id,
      moduleId: plan.moduleId,
      paymentId: orderId,
      status: "pending",
    });

    console.log("✅ Subscription created:", newSubscription._id);

    // 2️⃣ Create Juspay Order
    console.log("🏗️ Creating Juspay order...");

    const orderResponse = await juspay.order.create({
      order_id: orderId,
      amount: amountInRupees,
      currency: "INR",
      customer_id: providerId,
      customer_email: customerEmail || "customer@example.com",
      customer_phone: customerPhone || "9999999999",
      description: `Subscription: ${plan.name} - ₹${amountInRupees}`,
      return_url: returnUrl,
    });

    console.log("✅ Juspay order created:", orderResponse.order_id);

    // 3️⃣ Create Payment Session
    console.log("🔐 Creating payment session...");

    const session = await juspay.orderSession.create({
      order_id: orderId,
      action: "paymentPage",
      amount: amountInRupees,
      currency: "INR",

      customer_id: providerId,
      customer_email: customerEmail || "customer@example.com",
      customer_phone: customerPhone || "9999999999",

      payment_page_client_id: "hdfcmaster",
      return_url: returnUrl,

      redirect: true,
      auto_redirect: true,

      description: `Subscription: ${plan.name} - ₹${amountInRupees}`,
    });

    console.log("✅ Payment session created");
    console.log("🎯 Payment page URL:", session.payment_links?.web);

    // 4️⃣ Return response
    return res.json({
      success: true,
      order_id: orderId,
      amount: amountInRupees,
      plan: {
        id: plan._id,
        name: plan.name,
        durationInDays: plan.durationInDays,
      },
      payment_links: session.payment_links,
      sdk_payload: session.sdk_payload,
      return_url: returnUrl,
    });
  } catch (error) {
    console.error("❌ Subscription payment error:");
    console.error("Error message:", error.message);
    console.error("Error response:", error.response?.data);
    console.error("Full error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Payment creation failed",
      error: error.response?.data || error.toString(),
    });
  }
};

// GET /api/subscription/verify
// FIXED VERSION - Replace your verifySubscriptionPayment function

exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    // 1️⃣ Check payment status from Juspay
    const order = await juspay.order.status(orderId);

    if (order.status !== "CHARGED") {
      return res.json({
        success: false,
        status: order.status,
        message: "Payment not completed",
      });
    }

    // 2️⃣ Find pending subscription
    const subscription = await Subscription.findOne({
      paymentId: orderId,
      status: "pending",
    }).populate("planId");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Pending subscription not found",
      });
    }

    // 3️⃣ Cancel ALL other subscriptions for same module
    await Subscription.updateMany(
      {
        userId: subscription.userId,
        moduleId: subscription.moduleId,
        _id: { $ne: subscription._id },
      },
      {
        status: "cancelled",
        isCurrent: false,
      }
    );

    // 4️⃣ Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(
      endDate.getDate() + subscription.planId.durationInDays
    );

    // 5️⃣ Activate subscription
    subscription.status = "active";
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.isCurrent = true;

    await subscription.save();

    return res.json({
      success: true,
      message: "Plan upgraded successfully",
      subscription,
    });

  } catch (err) {
    console.error("❌ Verify subscription error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
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
