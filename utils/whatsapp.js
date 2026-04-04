const axios = require("axios");

/**
 * WhatsApp Utility to send messages using UltraMsg API.
 * Update your .env with WHATSAPP_API_URL and WHATSAPP_API_KEY.
 */
const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    // 🧹 Clean the phone number (keep only digits)
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    
    // 🌍 Ensure number has country code (e.g., 91 for India, 971 for UAE)
    // If it's 10 digits (India standard), we add 91 prefix.
    let finalNumber = cleanNumber;
    if (cleanNumber.length === 10) {
      finalNumber = "91" + cleanNumber;
    }

    const API_URL = process.env.WHATSAPP_API_URL;
    const API_KEY = process.env.WHATSAPP_API_KEY;

    if (!API_URL || !API_KEY) {
      console.warn("⚠️ WhatsApp API not configured in .env");
      return { success: false, message: "API not configured" };
    }

    // 🚀 UltraMsg requires: token, to, and body
    const payload = {
      token: API_KEY,
      to: finalNumber,
      body: message
    };

    console.log(`📱 Sending UltraMsg to ${finalNumber}: ${message.substring(0, 50)}...`);

    const response = await axios.post(API_URL, payload);

    console.log("✅ Message Status:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("❌ Send Error:", error.response ? error.response.data : error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendWhatsAppMessage };
