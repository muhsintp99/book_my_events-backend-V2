const crypto = require("crypto");
const axios = require("axios");

/**
 * PhonePe Payment Gateway Helper
 * Documentation: https://developer.phonepe.com/payment-gateway
 */

class PhonePeHelper {
    constructor() {
        this.merchantId = process.env.PHONEPE_MERCHANT_ID;
        this.saltKey = process.env.PHONEPE_SALT_KEY;
        this.saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
        this.env = process.env.PHONEPE_ENV || "UAT"; // UAT or PROD

        // API endpoints
        this.baseUrl = this.env === "PROD"
            ? "https://api.phonepe.com/apis/hermes"
            : "https://api-preprod.phonepe.com/apis/pg-sandbox";
    }

    /**
     * Generate SHA256 checksum for PhonePe API
     * @param {string} payload - Base64 encoded payload
     * @returns {string} - SHA256 hash
     */
    generateChecksum(payload) {
        const string = payload + "/pg/v1/pay" + this.saltKey;
        const sha256 = crypto.createHash("sha256").update(string).digest("hex");
        return sha256 + "###" + this.saltIndex;
    }

    /**
     * Verify callback checksum
     * @param {string} xVerify - X-VERIFY header from callback
     * @param {string} response - Base64 response
     * @returns {boolean}
     */
    verifyChecksum(xVerify, response) {
        const string = response + this.saltKey;
        const sha256 = crypto.createHash("sha256").update(string).digest("hex");
        const expectedChecksum = sha256 + "###" + this.saltIndex;
        return xVerify === expectedChecksum;
    }

    /**
     * Initiate payment with PhonePe
     * @param {Object} paymentData
     * @returns {Promise<Object>}
     */
    async initiatePayment(paymentData) {
        const {
            merchantTransactionId,
            amount,
            merchantUserId,
            callbackUrl,
            redirectUrl,
            redirectMode = "REDIRECT"
        } = paymentData;

        // Create payment payload
        const payload = {
            merchantId: this.merchantId,
            merchantTransactionId,
            merchantUserId,
            amount: amount * 100, // Convert to paise
            redirectUrl,
            redirectMode,
            callbackUrl,
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        // Encode payload to base64
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");

        // Generate checksum
        const checksum = this.generateChecksum(base64Payload);

        // API request
        const url = `${this.baseUrl}/pg/v1/pay`;

        try {
            const response = await axios.post(
                url,
                {
                    request: base64Payload
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "X-VERIFY": checksum
                    }
                }
            );

            return {
                success: response.data.success,
                data: response.data.data,
                code: response.data.code,
                message: response.data.message
            };
        } catch (error) {
            console.error("PhonePe initiate payment error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Payment initiation failed");
        }
    }

    /**
     * Check payment status
     * @param {string} merchantTransactionId
     * @returns {Promise<Object>}
     */
    async checkPaymentStatus(merchantTransactionId) {
        const url = `${this.baseUrl}/pg/v1/status/${this.merchantId}/${merchantTransactionId}`;

        // Generate checksum for status check
        const string = `/pg/v1/status/${this.merchantId}/${merchantTransactionId}` + this.saltKey;
        const sha256 = crypto.createHash("sha256").update(string).digest("hex");
        const checksum = sha256 + "###" + this.saltIndex;

        try {
            const response = await axios.get(url, {
                headers: {
                    "Content-Type": "application/json",
                    "X-VERIFY": checksum,
                    "X-MERCHANT-ID": this.merchantId
                }
            });

            return {
                success: response.data.success,
                data: response.data.data,
                code: response.data.code,
                message: response.data.message
            };
        } catch (error) {
            console.error("PhonePe status check error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || "Status check failed");
        }
    }

    /**
     * Generate unique merchant transaction ID
     * @returns {string}
     */
    generateMerchantTransactionId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000000);
        return `MT${timestamp}${random}`;
    }
}

module.exports = new PhonePeHelper();
