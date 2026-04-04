const axios = require("axios");

/**
 * WhatsApp Utility to send messages using UltraMsg API.
 * Update your .env with WHATSAPP_API_URL and WHATSAPP_API_KEY.
 */

/**
 * WhatsApp Utility using UltraMsg API (Config Pattern)
 * @param {string} phoneNumber - Recipient's phone number
 * @param {string} message - Message body
 * @param {number} priority - Message priority (1-10, default 10)
 */
const sendWhatsAppMessage = async (phoneNumber, message, priority = 10) => {
  try {
    // 🧹 Clean and Format phone number
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    let finalNumber = cleanNumber;
    
    if (cleanNumber.length === 10 && cleanNumber.startsWith('0')) {
      finalNumber = "971" + cleanNumber.substring(1);
    } else if (cleanNumber.length === 9 && cleanNumber.startsWith('5')) {
      finalNumber = "971" + cleanNumber;
    } else if (cleanNumber.length === 10) {
      finalNumber = "91" + cleanNumber;
    }

    const INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID;
    const API_KEY = process.env.WHATSAPP_API_KEY;

    if (!INSTANCE_ID || !API_KEY) {
      console.warn("⚠️ WhatsApp API credentials missing in .env");
      return { success: false, message: "API not configured" };
    }

    // 🔗 Format data for x-www-form-urlencoded
    const data = new URLSearchParams();
    data.append('token', API_KEY);
    data.append('to', finalNumber);
    data.append('body', message);
    data.append('priority', priority.toString()); // ✅ Added priority

    const config = {
      method: 'post',
      url: `https://api.ultramsg.com/${INSTANCE_ID}/messages/chat`,
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded' 
      },
      data: data
    };

    console.log(`📱 Sending WhatsApp to ${finalNumber}...`);

    const response = await axios(config);
    
    console.log("✅ UltraMsg Status:", response.data);
    return { success: true, data: response.data };

  } catch (error) {
    const errorMsg = error.response ? error.response.data : error.message;
    console.error("❌ WhatsApp Error:", errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Fetch Message Status/History from UltraMsg
 * @param {string} statusFilter - 'all' | 'queue' | 'sent' | 'unsent' | 'invalid' | 'expired'
 */
const getWhatsAppMessageStatus = async (statusFilter = 'all', page = 1, limit = 100) => {
    try {
        const INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID;
        const API_KEY = process.env.WHATSAPP_API_KEY;

        let url = `https://api.ultramsg.com/${INSTANCE_ID}/messages?token=${API_KEY}&page=${page}&limit=${limit}`;
        if (statusFilter !== 'all') {
            url += `&status=${statusFilter}`;
        }

        const response = await axios.get(url);
        return { success: true, data: response.data };
    } catch (error) {
        console.error("❌ WhatsApp Status Fetch Error:", error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Verify WhatsApp Connection (UltraMsg Instance Status)
 */
const verifyWhatsAppConnection = async () => {
    try {
        const INSTANCE_ID = process.env.WHATSAPP_INSTANCE_ID;
        const API_KEY = process.env.WHATSAPP_API_KEY;

        if (!INSTANCE_ID || !API_KEY) {
            console.warn("⚠️ WhatsApp: Instance or API Key missing in .env");
            return;
        }

        const url = `https://api.ultramsg.com/${INSTANCE_ID}/instance/status?token=${API_KEY}`;
        const res = await axios.get(url);

        // ✅ UltraMsg status check (authenticated / active / standby)
        const status = res.data?.account_status || res.data?.status || 'Unknown';
        
        if (status === "authenticated" || status === "active") {
            console.log(`✅ WhatsApp: UltraMsg Connected (${INSTANCE_ID})`);
        } else {
            console.warn(`\n⚠️ WhatsApp: Status is "${status}" (ID: ${res.data?.status_id || 'N/A'})`);
            console.warn(`🔗 DASHBOARD: https://ultramsg.com/dashboard/`);
            console.warn(`--------------------------------------------------\n`);
        }
    } catch (err) {
        if (err.response && err.response.status === 401) {
            console.error("❌ WhatsApp: Invalid UltraMsg Token in .env");
        } else {
            console.error("❌ WhatsApp Connection Error:", err.message);
        }
    }
};

// Auto-verify on load
verifyWhatsAppConnection();

module.exports = { 
  sendWhatsAppMessage, 
  getWhatsAppMessageStatus, 
  verifyWhatsAppConnection 
};
