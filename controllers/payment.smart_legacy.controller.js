const crypto = require("crypto");
const Booking = require("../models/vendor/Booking");
const config = require("../config/smartgateway_config.json");

// ✅ Generate HDFC SmartGateway Signature Correctly
function generateSignature(requestData, key) {
  // Required concatenation order (HDFC Rules)
  const dataString =
    requestData.merchantId +
    requestData.amount +
    requestData.currency +
    requestData.merchantTxnId +
    requestData.redirectUrl +
    requestData.paymentPageClientId +
    requestData.customerEmail +
    requestData.customerMobile;

  return crypto
    .createHmac("sha256", key)
    .update(dataString)
    .digest("base64");
}

exports.createOrderLegacy = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("userId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Convert amount to string exactly as HDFC expects
    const amount = booking.finalPrice.toString();

    // REQUIRED FIELDS (STRICT ORDER)
    const requestData = {
      merchantId: config.MERCHANT_ID,
      amount: amount,
      currency: "INR",
      merchantTxnId: "MTX_" + Date.now(),
      redirectUrl: "https://dashboard.bookmyevent.ae/payment-success",
      paymentPageClientId: config.PAYMENT_PAGE_CLIENT_ID,
      customerEmail: booking.userId.email,
      customerMobile: booking.userId.mobile || "0000000000",
    };

    // Generate VALID HDFC signature
    const signature = generateSignature(requestData, config.API_KEY);

    // Build the full payment payload sent to frontend
    const paymentPayload = {
      ...requestData,
      signature,
      actionUrl: `${config.BASE_URL}/paymentpage/merchant/v1/pay`,
    };

    console.log("🔍 Sending Payment Payload to Frontend:", paymentPayload);

    return res.json({
      success: true,
      payment_form: paymentPayload,
    });

  } catch (err) {
    console.error("❌ Legacy PG Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Order creation failed",
      error: err.message,
    });
  }
};

// const juspay = require("../utils/juspayApi");
// const Booking = require("../models/vendor/Booking");
// const config = require("../config/smartgateway_config.json");

// exports.createJuspayOrder = async (req, res) => {
//   try {
//     const { bookingId } = req.body;

//     const booking = await Booking.findById(bookingId).populate("userId");
//     if (!booking) {
//       return res.status(404).json({ success: false, message: "Booking not found" });
//     }

//     const amountPaise = booking.finalPrice * 100;

//     const orderPayload = {
//       order_id: "order_" + Date.now(),
//       customer_id: booking.userId._id.toString(),
//       amount: amountPaise,
//       currency: "INR",
//       customer_email: booking.userId.email,
//       customer_phone: booking.userId.mobile || "9999999999",
//       return_url: config.RETURN_URL,
//       description: "Booking Payment",
//       create_payment: true
//     };

//     const juspayRes = await juspay.post("/orders", orderPayload);

//     return res.status(200).json({
//       success: true,
//       order: juspayRes.data
//     });

//   } catch (err) {
//     console.error("❌ Juspay Error:", err.response?.data || err.message);
//     return res.status(500).json({
//       success: false,
//       message: "Juspay order creation failed",
//       error: err.response?.data || err.message,
//     });
//   }
// };
