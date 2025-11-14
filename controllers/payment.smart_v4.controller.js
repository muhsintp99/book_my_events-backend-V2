const smartGateway = require("../utils/smartgateway");
const config = require("../config/smartgateway_config.json");

exports.createPaymentSession = async (req, res) => {
  try {
    const orderId = "order_" + Date.now();
    const amount = req.body.amount || 100;

    const returnUrl = "https://yourdomain.com/payment-status";

    const session = await smartGateway.orderSession.create({
      order_id: orderId,
      amount,
      currency: "INR",
      payment_page_client_id: config.PAYMENT_PAGE_CLIENT_ID,
      action: "paymentPage",
      return_url: returnUrl,
      customer_id: "customer_" + orderId
    });

    if (session.http) delete session.http;

    return res.json({
      success: true,
      data: session
    });

  } catch (err) {
    console.log("SmartGateway V4 Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
