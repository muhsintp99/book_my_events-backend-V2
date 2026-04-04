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

//     const orderResponse = await juspay.order.create({
//       order_id: testOrderId,
//       amount: 10000,
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

//     const booking = await Booking.findById(bookingId)
//       .populate("userId")
//       .populate("venueId")
//       .populate("makeupId")
//       .populate("photographyId")
//       .populate("cateringId");

//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found" });
//     }

//     /* ================= AMOUNT LOGIC ================= */
//     let advanceAmount = Number(booking.advanceAmount) || 0;

//     if (advanceAmount <= 0) {
//       if (booking.moduleType === "Makeup Artist")
//         advanceAmount = Number(booking.makeupId?.advanceBookingAmount) || 0;
//       if (booking.moduleType === "Photography")
//         advanceAmount = Number(booking.photographyId?.advanceBookingAmount) || 0;
//       if (booking.moduleType === "Catering")
//         advanceAmount = Number(booking.cateringId?.advanceBookingAmount) || 0;
//     }

//     if (advanceAmount <= 0) {
//       return res.status(400).json({
//         success: false,
//         message: "No advance amount configured",
//       });
//     }

//     const amount = advanceAmount.toFixed(2);
//     const orderId = `order_${bookingId}_${Date.now()}`;

//     /* ================= RETURN URL ================= */
//     // ⚠️ MUST be static — HDFC may strip params
//     const returnUrl = "https://bookmyevent.ae/payment-success/index.html";

//     /* ================= CREATE ORDER ================= */
//     await juspay.order.create({
//       order_id: orderId,
//       amount,
//       currency: "INR",
//       customer_id: booking.userId._id.toString(),
//       customer_email: booking.userId.email,
//       customer_phone: booking.userId.mobile || "9999999999",
//       description: `Advance Payment ₹${amount}`,
//       return_url: returnUrl,

//       // ✅ HDFC UDF FIELDS (VISIBLE IN DASHBOARD + ORDER STATUS API)
//       udf1: bookingId,
//       udf2: booking.moduleType,
//       udf3: booking.userId._id.toString(),
//     });

//     /* ================= CREATE SESSION ================= */
//     const session = await juspay.orderSession.create({
//       order_id: orderId,
//       action: "paymentPage",
//       amount,
//       currency: "INR",
//       customer_id: booking.userId._id.toString(),
//       customer_email: booking.userId.email,
//       customer_phone: booking.userId.mobile || "9999999999",
//       payment_page_client_id: "hdfcmaster",
//       return_url: returnUrl,
//       redirect: true,
//       auto_redirect: true,
//     });

//     /* ================= SAVE BOOKING ================= */
//     booking.paymentOrderId = orderId;
//     booking.paymentStatus = "initiated";
//     booking.paidAmount = advanceAmount;
//     await booking.save();

//     return res.json({
//       success: true,
//       order_id: orderId,
//       bookingId,
//       advanceAmount: amount,

//         // sdk_payload: session.sdk_payload,

//       payment_links: session.payment_links,
//       return_url: returnUrl,
//     });

//   } catch (err) {
//     console.error("❌ Payment Error:", err.message);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// /**
//  * JUSPAY WEBHOOK HANDLER
//  */
// exports.juspayWebhook = async (req, res) => {
//   try {
//     const { order_id, status } = req.body;
//     if (!order_id) return res.sendStatus(200);

//     /* ================= UPDATE BOOKING ================= */
//     const booking = await Booking.findOne({ paymentOrderId: order_id });

//     if (booking) {
//       if (status === "CHARGED") {
//         booking.paymentStatus = "completed";
//       } else if (status === "FAILED") {
//         booking.paymentStatus = "failed";
//       }
//       await booking.save();
//     }

//     return res.sendStatus(200);
//   } catch (err) {
//     console.error("❌ Webhook Error:", err.message);
//     return res.sendStatus(200);
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

//     // Update booking in database
//     if (bookingId) {
//       await Booking.findByIdAndUpdate(bookingId, {
//         paymentStatus: bookingStatus,
//         paymentOrderId: orderId,
//         paidAmount: order.amount,
//       });
//     }

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

// // /api/payment/verify
// exports.verifyBookingPayment = async (req, res) => {
//   try {
//     let { bookingId, orderId } = req.query;

//     console.log("🔍 Verify request:", { bookingId, orderId });

//     /* ======================================
//        🔥 RECOVERY LOGIC (ADD THIS PART)
//     ====================================== */

//     // 1️⃣ Try bookingId → orderId
//     if (!orderId && bookingId) {
//       const booking = await Booking.findById(bookingId);
//       orderId = booking?.paymentOrderId;
//     }

//     // 2️⃣ FINAL SAFETY NET (HDFC STRIPS EVERYTHING)
//     if (!orderId) {
//       const latest = await Booking.findOne({
//         paymentStatus: { $in: ["initiated", "pending"] }
//       }).sort({ createdAt: -1 });

//       orderId = latest?.paymentOrderId;
//       bookingId = latest?._id;
//     }

//     // 3️⃣ Still missing → hard fail
//     if (!orderId) {
//       return res.json({
//         status: "failed",
//         message: "Payment reference not found"
//       });
//     }

//     /* ======================================
//        🔐 VERIFY WITH JUSPAY
//     ====================================== */

//     const order = await juspay.order.status(orderId);

//     const booking = await Booking.findOne({
//       paymentOrderId: orderId
//     });

//     if (order.status === "CHARGED") {
//       if (booking) {
//         booking.paymentStatus = "completed";
//         booking.paidAmount = order.amount;
//         await booking.save();
//       }

//       return res.json({
//         status: "completed",
//         bookingId: booking?._id,
//         amount: order.amount,
//         transactionId: order.order_id,
//       });
//     }

//     if (["PENDING", "AUTHORIZING", "NEW", "PENDING_VBV"].includes(order.status)) {
//       return res.json({ status: "pending" });
//     }

//     if (booking) {
//       booking.paymentStatus = "failed";
//       await booking.save();
//     }

//     return res.json({ status: "failed" });

//   } catch (err) {
//     console.error("❌ verifyBookingPayment error:", err);
//     return res.json({
//       status: "failed",
//       message: "Verification error"
//     });
//   }
// };
// // ===============================
// // GET LATEST PAYMENT (FALLBACK)
// // ===============================
// // GET LATEST INITIATED PAYMENT (HDFC SAFE)
// exports.getLatestPayment = async (req, res) => {
//   try {
//     const booking = await Booking.findOne({
//       paymentStatus: "initiated"
//     }).sort({ createdAt: -1 });

//     if (!booking || !booking.paymentOrderId) {
//       return res.json({ success: false });
//     }

//     return res.json({
//       success: true,
//       orderId: booking.paymentOrderId,
//       bookingId: booking._id
//     });

//   } catch (err) {
//     console.error("❌ getLatestPayment:", err);
//     res.json({ success: false });
//   }
// };

// module.exports = {
//   testConnection: exports.testConnection,
//   createSmartGatewayPayment: exports.createSmartGatewayPayment,
//   juspayWebhook: exports.juspayWebhook,
//   createSubscriptionPayment: exports.createSubscriptionPayment,
//   verifySubscriptionPayment: exports.verifySubscriptionPayment,
//   handleJuspayResponse: exports.handleJuspayResponse,
//   verifyBookingPayment: exports.verifyBookingPayment,
//   getLatestPayment: exports.getLatestPayment,
// };

const { Juspay, APIError } = require("expresscheckout-nodejs");
const Booking = require("../models/vendor/Booking");
const config = require("../config/smartgateway_config.json");
const Subscription = require("../models/admin/Subscription");
const Plan = require("../models/admin/Plan");
const User = require("../models/User");
const VendorProfile = require("../models/vendor/vendorProfile");
const Wallet = require("../models/vendor/Wallet"); // Added Wallet model


// Helper: Update Vendor Wallet on successful payment
const updateVendorWallet = async (vendorId, amount, bookingId, description = "Booking payment") => {
  try {
    if (!vendorId) return;
    
    let wallet = await Wallet.findOne({ vendorId });
    if (!wallet) {
      wallet = new Wallet({ vendorId, balance: 0, transactions: [] });
    }

    // Check if this bookingId already has a 'credit' transaction to prevent duplicates
    const isDuplicate = wallet.transactions.some(tx => 
        tx.bookingId?.toString() === bookingId?.toString() && tx.type === 'credit'
    );

    if (isDuplicate) {
        console.log("⚠️ Duplicate wallet credit attempt for booking:", bookingId);
        return;
    }

    wallet.balance += Number(amount);
    wallet.transactions.push({
      bookingId,
      amount: Number(amount),
      type: 'credit',
      description,
      status: 'completed',
      date: new Date()
    });

    await wallet.save();
    console.log(`✅ Wallet updated for vendor ${vendorId}: +₹${amount}`);
  } catch (err) {
    console.error("❌ Error updating vendor wallet:", err.message);
  }
};



// Initialize SmartGateway with BASIC Authentication (API Key)
const juspay = new Juspay({
  merchantId: config.MERCHANT_ID,
  baseUrl: config.BASE_URL,
  apiKey: config.API_KEY,
});

console.log("✅ Juspay SDK initialized with BASIC Auth");
console.log("   Merchant ID:", config.MERCHANT_ID);
console.log("   Base URL:", config.BASE_URL);
// 🔥 Full payment modules
const FULL_PAYMENT_MODULES = ["Cake", "Ornaments", "Ornament", "Boutique", "Boutiques"];


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

    const booking = await Booking.findById(bookingId)
      .populate("userId")
      .populate("venueId")
      .populate("makeupId")
      .populate("photographyId")
      .populate("cateringId")
      .populate("ornamentId")
      .populate("mehandiId");
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    /* ================= AMOUNT LOGIC ================= */
    let amountToPay = 0;

    // 🎂 CAKE → FULL PAYMENT
    // 💍 ORNAMENTS → FULL PAYMENT
    if (FULL_PAYMENT_MODULES.includes(booking.moduleType)) {
      amountToPay = Number(booking.finalPrice);
    }


    // 🧾 OTHER MODULES → ADVANCE PAYMENT
    else {
      amountToPay = Number(booking.advanceAmount) || 0;

      if (amountToPay <= 0) {
        if (booking.moduleType === "Makeup Artist") {
          amountToPay =
            Number(booking.makeupId?.advanceBookingAmount) || 0;
        }

        if (booking.moduleType === "Photography") {
          amountToPay =
            Number(booking.photographyId?.advanceBookingAmount) || 0;
        }

        if (booking.moduleType === "Catering") {
          amountToPay =
            Number(booking.cateringId?.advanceBookingAmount) || 0;
        }

        if (
  booking.moduleType === "Mehandi" ||
  booking.moduleType === "Mehandi Artist"
) {
  amountToPay =
    Number(booking.mehandiId?.advanceBookingAmount) ||
    Number(booking.advanceAmount) ||
    0;
}
      }
    }

    // ❌ FINAL SAFETY CHECK
    if (amountToPay <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount not configured",
      });
    }

    const amount = amountToPay.toFixed(2);
    const orderId = `order_${bookingId}_${Date.now()}`;

    /* ================= RETURN URL ================= */
    const returnUrl = "https://bookmyevent.ae/payment-success/index.html";

    /* ================= CREATE ORDER ================= */
    await juspay.order.create({
      order_id: orderId,
      amount,
      currency: "INR",
      customer_id: booking.userId._id.toString(),
      customer_email: booking.userId.email,
      customer_phone: booking.userId.mobile || "9999999999",
      description: FULL_PAYMENT_MODULES.includes(booking.moduleType)
        ? `Full Payment ₹${amount}`
        : `Advance Payment ₹${amount}`,

      return_url: returnUrl,

      udf1: bookingId,
      udf2: booking.moduleType,
      udf3: booking.userId._id.toString(),
    });

    /* ================= CREATE SESSION ================= */
    const session = await juspay.orderSession.create({
      order_id: orderId,
      action: "paymentPage",
      amount,
      currency: "INR",
      customer_id: booking.userId._id.toString(),
      customer_email: booking.userId.email,
      customer_phone: booking.userId.mobile || "9999999999",
      payment_page_client_id: "hdfcmaster",
      return_url: returnUrl,
      redirect: true,
      auto_redirect: true,
    });

    /* ================= SAVE BOOKING ================= */
    booking.paymentStatus = "initiated";
    booking.paymentOrderId = orderId;

    // Full payment modules → remaining = finalPrice
    booking.paidAmount = 0;

    if (FULL_PAYMENT_MODULES.includes(booking.moduleType)) {
      booking.remainingAmount = 0;
    } else {
      booking.remainingAmount =
        Number(booking.finalPrice) - Number(amount);
    }


    await booking.save();

    return res.json({
      success: true,
      order_id: orderId,
      bookingId,
      payableAmount: amount,
      payment_links: session.payment_links,
      return_url: returnUrl,
    });

  } catch (err) {
    console.error("❌ Payment Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * CREATE SUBSCRIPTION PAYMENT SESSION
 */
exports.createSubscriptionPayment = async (req, res) => {
  try {
    const { planId } = req.body;
    const providerId = req.user?._id || req.body.providerId || req.body.userId;

    if (!providerId) {
      return res.status(400).json({ success: false, message: "Provider ID is required" });
    }

    if (!planId) {
      return res.status(400).json({ success: false, message: "Plan ID is required" });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    // Resolve User: try providerId as User ID first, then as VendorProfile ID
    let user = await User.findById(providerId);
    if (!user) {
      const vProfile = await VendorProfile.findById(providerId);
      if (vProfile && vProfile.user) {
        user = await User.findById(vProfile.user);
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "Provider (User) not found" });
    }

    const userId = user._id;
    const amount = Number(plan.price).toFixed(2);
    const orderId = `SUB_${userId}_${Date.now()}`;
    const returnUrl = `${req.headers.origin || 'https://vendor.bookmyevent.ae'}/upgrade-success`;

    /* ================= CREATE ORDER ================= */

    await juspay.order.create({
      order_id: orderId,
      amount,
      currency: "INR",
      customer_id: userId.toString(),
      customer_email: user.email,
      customer_phone: user.mobile || "9999999999",
      description: `Upgrade to ${plan.name} - ₹${amount}`,
      return_url: returnUrl,
      udf1: planId.toString(),
      udf2: "subscription",
      udf3: userId.toString(),
    });

    /* ================= CREATE SESSION ================= */
    const session = await juspay.orderSession.create({
      order_id: orderId,
      action: "paymentPage",
      amount,
      currency: "INR",
      customer_id: userId.toString(),
      customer_email: user.email,
      customer_phone: user.mobile || "9999999999",
      payment_page_client_id: "hdfcmaster",
      return_url: returnUrl,
      redirect: true,
      auto_redirect: true,
    });

    /* ================= SAVE PENDING SUBSCRIPTION ================= */
    await Subscription.create({
      userId: userId,
      planId: plan._id,
      moduleId: plan.moduleId,
      moduleModel: plan.moduleModel || 'Module',
      paymentId: orderId,
      status: "pending",
      isCurrent: false,
    });

    return res.json({
      success: true,
      order_id: orderId,
      payableAmount: amount,
      payment_links: session.payment_links,
      return_url: returnUrl,
    });

  } catch (err) {
    console.error("❌ Subscription Payment Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * VERIFY SUBSCRIPTION PAYMENT
 */
exports.verifySubscriptionPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const order = await juspay.order.status(orderId);
    const subscription = await Subscription.findOne({ paymentId: orderId }).populate("planId");

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    if (order.status === "CHARGED") {
      const plan = subscription.planId;
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.durationInDays);

      // Cancel other current subscriptions for same module
      await Subscription.updateMany(
        { userId: subscription.userId, moduleId: subscription.moduleId, _id: { $ne: subscription._id } },
        { status: "cancelled", isCurrent: false }
      );

      subscription.status = "active";
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.isCurrent = true;
      await subscription.save();

      // Update VendorProfile
      const vendorProfile = await VendorProfile.findOne({ user: subscription.userId });
      if (vendorProfile) {
        vendorProfile.subscriptionStatus = "active";
        vendorProfile.subscriptionPlan = plan._id;
        vendorProfile.subscriptionStartDate = startDate;
        vendorProfile.subscriptionEndDate = endDate;
        vendorProfile.isFreeTrial = false;
        vendorProfile.lastPaymentDate = new Date();
        
        await vendorProfile.save();
        console.log(`✅ VendorProfile updated for user: ${subscription.userId}`);
      }

      return res.json({

        success: true,
        status: "completed",
        message: "Subscription activated successfully",
        subscription
      });
    }

    return res.json({
      success: false,
      status: order.status,
      message: `Payment status: ${order.status}`
    });

  } catch (err) {
    console.error("❌ Subscription Verification Error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


/**
 * JUSPAY WEBHOOK HANDLER
 */
exports.juspayWebhook = async (req, res) => {
  try {
    const { order_id, status } = req.body;
    if (!order_id) return res.sendStatus(200);

    /* ================= UPDATE BOOKING ================= */
    const booking = await Booking.findOne({ paymentOrderId: order_id });

    if (booking) {
      if (status === "CHARGED") {
        const alreadyCompleted = (booking.paymentStatus === "completed");
        booking.paymentStatus = "completed";

        if (FULL_PAYMENT_MODULES.includes(booking.moduleType)) {
          booking.paidAmount = booking.finalPrice;
          booking.remainingAmount = 0;
        }

        // Add to wallet if this is the first success
        if (!alreadyCompleted) {
          await updateVendorWallet(
            booking.providerId, 
            booking.paidAmount || booking.finalPrice, 
            booking._id,
            `User payment for booking #${booking._id.toString().slice(-6).toUpperCase()}`
          );
        }
      } else if (["AUTHENTICATION_FAILED", "AUTHORIZATION_FAILED", "JUSPAY_DECLINED", "AUTO_REFUNDED"].includes(status)) {
        booking.paymentStatus = "cancelled";
        booking.status = "Cancelled";
      } else if (status === "FAILED") {
        booking.paymentStatus = "failed";
        booking.status = "Cancelled";
      }
      await booking.save();
    }


    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    return res.sendStatus(200);
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

// /api/payment/verify
exports.verifyBookingPayment = async (req, res) => {
  try {
    let { bookingId, orderId } = req.query;

    console.log("🔍 Verify request:", { bookingId, orderId });

    /* ======================================
       🔥 RECOVERY LOGIC (ADD THIS PART)
    ====================================== */

    // 1️⃣ Try bookingId → orderId
    if (!orderId && bookingId) {
      const booking = await Booking.findById(bookingId);
      orderId = booking?.paymentOrderId;
    }

    // 2️⃣ FINAL SAFETY NET (HDFC STRIPS EVERYTHING)
    if (!orderId) {
      const latest = await Booking.findOne({
        paymentStatus: { $in: ["initiated", "pending"] },
      }).sort({ createdAt: -1 });

      orderId = latest?.paymentOrderId;
      bookingId = latest?._id;
    }

    // 3️⃣ Still missing → hard fail
    if (!orderId) {
      return res.json({
        status: "failed",
        message: "Payment reference not found",
      });
    }

    /* ======================================
       🔐 VERIFY WITH JUSPAY
    ====================================== */

    const order = await juspay.order.status(orderId);

    console.log("🔎 Juspay order status:", order.status, "for orderId:", orderId);

    const booking = await Booking.findOne({
      paymentOrderId: orderId,
    });

    // ✅ SUCCESS
    if (order.status === "CHARGED") {
      if (booking) {
        const alreadyCompleted = (booking.paymentStatus === "completed");
        booking.paymentStatus = "completed";
        booking.paidAmount = order.amount;
        await booking.save();

        if (!alreadyCompleted) {
          await updateVendorWallet(
            booking.providerId, 
            order.amount, 
            booking._id,
            `User payment for booking #${booking._id.toString().slice(-6).toUpperCase()}`
          );
        }
      }

      return res.json({
        status: "completed",
        bookingId: booking?._id,
        amount: order.amount,
        transactionId: order.order_id,
      });
    }

    // 🔴 CANCELLED / USER-ABORTED STATUSES
    const CANCELLED_STATUSES = [
      "AUTHENTICATION_FAILED",
      "AUTHORIZATION_FAILED",
      "JUSPAY_DECLINED",
      "AUTO_REFUNDED",
      "CAPTURE_FAILED",
      "VOID_FAILED",
      "NOT_FOUND",
    ];

    if (CANCELLED_STATUSES.includes(order.status)) {
      if (booking) {
        booking.paymentStatus = "cancelled";
        booking.status = "Cancelled";
        await booking.save();
      }

      return res.json({
        status: "cancelled",
        message: "Payment was cancelled. No amount has been deducted.",
      });
    }

    // ⏳ GENUINELY PENDING (still processing)
    if (
      ["PENDING", "AUTHORIZING", "PENDING_VBV"].includes(order.status)
    ) {
      return res.json({ status: "pending" });
    }

    // 🟡 NEW status — could be cancelled or genuinely new
    // If the order is still NEW after the user was redirected back,
    // it likely means they cancelled before even attempting payment.
    if (order.status === "NEW") {
      // Check if the booking was initiated more than 30 seconds ago
      // If so, treat it as cancelled
      if (booking) {
        const initiatedAt = new Date(booking.updatedAt || booking.createdAt);
        const secondsSinceInit = (Date.now() - initiatedAt.getTime()) / 1000;

        if (secondsSinceInit > 30) {
          booking.paymentStatus = "cancelled";
          booking.status = "Cancelled";
          await booking.save();

          return res.json({
            status: "cancelled",
            message: "Payment was cancelled. No amount has been deducted.",
          });
        }
      }

      // Otherwise, still treat as pending (fresh order)
      return res.json({ status: "pending" });
    }

    // ❌ ALL OTHER STATUSES → FAILED
    if (booking) {
      booking.paymentStatus = "failed";
      booking.status = "Cancelled";
      await booking.save();
    }

    return res.json({
      status: "failed",
      message: "Payment failed. Please try again.",
    });
  } catch (err) {
    console.error("❌ verifyBookingPayment error:", err);
    return res.json({
      status: "failed",
      message: "Verification error",
    });
  }
};
// ===============================
// GET LATEST PAYMENT (FALLBACK)
// ===============================
// GET LATEST INITIATED PAYMENT (HDFC SAFE)
exports.getLatestPayment = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      paymentStatus: "initiated",
    }).sort({ createdAt: -1 });

    if (!booking || !booking.paymentOrderId) {
      return res.json({ success: false });
    }

    return res.json({
      success: true,
      orderId: booking.paymentOrderId,
      bookingId: booking._id,
    });
  } catch (err) {
    console.error("❌ getLatestPayment:", err);
    res.json({ success: false });
  }
};

module.exports = {
  testConnection: exports.testConnection,
  createSmartGatewayPayment: exports.createSmartGatewayPayment,
  juspayWebhook: exports.juspayWebhook,
  createSubscriptionPayment: exports.createSubscriptionPayment,
  verifySubscriptionPayment: exports.verifySubscriptionPayment,
  handleJuspayResponse: exports.handleJuspayResponse,
  verifyBookingPayment: exports.verifyBookingPayment,
  getLatestPayment: exports.getLatestPayment,
};
