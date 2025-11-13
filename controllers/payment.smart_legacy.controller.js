const crypto = require("crypto");
const Booking = require("../models/vendor/Booking");
const config = require("../config/smartgateway_config.json");

// Generate HMAC SHA256 signature
function generateSignature(data, key) {
  return crypto.createHmac("sha256", key).update(JSON.stringify(data)).digest("base64");
}

exports.createOrderLegacy = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("userId");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const amount = booking.finalPrice.toString();

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

    // SIGNATURE REQUIRED BY SMARTGATEWAY LEGACY
    const signature = generateSignature(requestData, config.API_KEY);

    const paymentPayload = {
      ...requestData,
      signature,
      actionUrl: `${config.BASE_URL}/paymentpage/merchant/v1/pay`,
    };

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
