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

// Initialize SmartGateway with BASIC Authentication (API Key)
const juspay = new Juspay({
  merchantId: config.MERCHANT_ID,
  baseUrl: config.BASE_URL,
  apiKey: config.API_KEY,
});

console.log("✅ Juspay SDK initialized with BASIC Auth");
console.log("   Merchant ID:", config.MERCHANT_ID);
console.log("   Base URL:", config.BASE_URL);

const FULL_PAYMENT_MODULES = ["Cake", "Ornaments", "Boutique"];

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
      .populate("boutiqueId");


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
    booking.paymentStatus = "completed";

    if (FULL_PAYMENT_MODULES.includes(booking.moduleType)) {
      booking.paidAmount = booking.finalPrice;
      booking.remainingAmount = 0;
    }
  } else if (status === "FAILED") {
    booking.paymentStatus = "failed";
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

    const booking = await Booking.findOne({
      paymentOrderId: orderId,
    });

    if (order.status === "CHARGED") {
      if (booking) {
        booking.paymentStatus = "completed";
        booking.paidAmount = order.amount;
        await booking.save();
      }

      return res.json({
        status: "completed",
        bookingId: booking?._id,
        amount: order.amount,
        transactionId: order.order_id,
      });
    }

    if (
      ["PENDING", "AUTHORIZING", "NEW", "PENDING_VBV"].includes(order.status)
    ) {
      return res.json({ status: "pending" });
    }

    if (booking) {
      booking.paymentStatus = "failed";
      await booking.save();
    }

    return res.json({ status: "failed" });
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
