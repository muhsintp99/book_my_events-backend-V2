const axios = require("axios");
const Booking = require("../models/vendor/Booking");
const config = require("../config/smartgateway_config.json");

exports.createHdfcSmartToken = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("userId");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const amount = booking.finalPrice.toString();

    // ---- Step 1: Generate Token -------
    const tokenPayload = {
      merchantId: config.MERCHANT_ID,
      merchantTransactionId: "MTX_" + Date.now(),
      amount: amount,
      currency: "INR",
      redirectUrl: "https://dashboard.bookmyevent.ae/payment-success",
      responseKey: config.RESPONSE_KEY,
      paymentPageClientId: config.PAYMENT_PAGE_CLIENT_ID,
      customerEmail: booking.userId.email,
      customerMobile: booking.userId.mobile || "0000000000",
    };

    console.log("📡 Calling SmartGateway Token API", tokenPayload);

    const tokenResponse = await axios.post(
      `${config.BASE_URL}/paymenttoken/merchant/v4/token`,
      tokenPayload,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.API_KEY,
        },
        validateStatus: () => true,
      }
    );

    console.log("🔥 SmartGateway Token Response:", tokenResponse.status, tokenResponse.data);

    if (!tokenResponse.data?.token) {
      return res.status(400).json({
        success: false,
        message: "Failed to generate payment token",
        error: tokenResponse.data,
      });
    }

    // Save orderId
    booking.paymentOrderId = tokenPayload.merchantTransactionId;
    await booking.save();

    // ---- Step 2: Build Redirect URL -----
    const paymentUrl = `${config.BASE_URL}/paymentpage?token=${tokenResponse.data.token}`;

    return res.json({
      success: true,
      payment_url: paymentUrl,
    });

  } catch (err) {
    console.error("❌ SmartGateway Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Order creation failed",
      error: err.message,
    });
  }
};
