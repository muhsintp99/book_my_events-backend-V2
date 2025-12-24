const Payment = require("../../models/admin/Payment");
const SubscriptionRequest = require("../../models/admin/SubscriptionRequest");
const Subscription = require("../../models/admin/Subscription");
const Plan = require("../../models/admin/Plan");
const phonepeHelper = require("../../utils/phonepeHelper");

/**
 * ======================================
 * INITIATE PAYMENT FOR SUBSCRIPTION
 * ======================================
 */
exports.initiatePayment = async (req, res) => {
    try {
        const { requestId, adminNote } = req.body;
        const adminId = req.user?._id;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });
        }

        // 1️⃣ Validate subscription request
        const request = await SubscriptionRequest.findById(requestId)
            .populate("planId")
            .populate("userId", "firstName lastName email")
            .populate("moduleId", "title");

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Subscription request not found"
            });
        }

        if (request.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Subscription request already processed"
            });
        }

        // 2️⃣ Check if payment already exists for this request
        const existingPayment = await Payment.findOne({
            subscriptionRequestId: requestId,
            status: { $in: ["pending", "success"] }
        });

        if (existingPayment) {
            if (existingPayment.status === "success") {
                return res.status(400).json({
                    success: false,
                    message: "Payment already completed for this request"
                });
            }

            // Return existing pending payment URL
            return res.status(200).json({
                success: true,
                message: "Payment already initiated",
                payment: existingPayment,
                paymentUrl: existingPayment.paymentUrl
            });
        }

        // 3️⃣ Generate merchant transaction ID
        const merchantTransactionId = phonepeHelper.generateMerchantTransactionId();

        // 4️⃣ Create payment record
        const payment = await Payment.create({
            merchantTransactionId,
            subscriptionRequestId: requestId,
            userId: request.userId._id,
            adminId,
            planId: request.planId._id,
            moduleId: request.moduleId._id,
            amount: request.planId.price,
            currency: "INR",
            status: "pending",
            adminNote: adminNote || ""
        });

        // 5️⃣ Initiate PhonePe payment
        const callbackUrl = process.env.PHONEPE_CALLBACK_URL ||
            `${process.env.BASE_URL || "https://api.bookmyevent.ae"}/api/admin/subscription/payment/callback`;

        const redirectUrl = process.env.PHONEPE_REDIRECT_URL ||
            `${process.env.FRONTEND_URL || "https://admin.bookmyevent.ae"}/subscriptions/payment-success`;

        const paymentData = {
            merchantTransactionId,
            amount: request.planId.price,
            merchantUserId: `USER_${request.userId._id}`,
            callbackUrl,
            redirectUrl: `${redirectUrl}?merchantTransactionId=${merchantTransactionId}`,
            redirectMode: "REDIRECT"
        };

        const phonePeResponse = await phonepeHelper.initiatePayment(paymentData);

        if (!phonePeResponse.success) {
            // Update payment status to failed
            payment.status = "failed";
            payment.phonePeResponse = phonePeResponse;
            await payment.save();

            return res.status(400).json({
                success: false,
                message: phonePeResponse.message || "Payment initiation failed",
                error: phonePeResponse
            });
        }

        // 6️⃣ Update payment with PhonePe response
        payment.paymentUrl = phonePeResponse.data.instrumentResponse.redirectInfo.url;
        payment.phonePeResponse = phonePeResponse;
        await payment.save();

        // 7️⃣ Return payment URL
        res.status(200).json({
            success: true,
            message: "Payment initiated successfully",
            payment: {
                id: payment._id,
                merchantTransactionId: payment.merchantTransactionId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status
            },
            paymentUrl: payment.paymentUrl,
            redirectUrl: phonePeResponse.data.instrumentResponse.redirectInfo.url
        });

    } catch (error) {
        console.error("Initiate payment error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Payment initiation failed"
        });
    }
};

/**
 * ======================================
 * PHONEPE PAYMENT CALLBACK (WEBHOOK)
 * ======================================
 */
exports.paymentCallback = async (req, res) => {
    try {
        const { response } = req.body;
        const xVerify = req.headers["x-verify"];

        console.log("📞 PhonePe Callback Received:", { response, xVerify });

        // 1️⃣ Verify checksum
        const isValid = phonepeHelper.verifyChecksum(xVerify, response);

        if (!isValid) {
            console.error("❌ Invalid checksum in callback");
            return res.status(400).json({
                success: false,
                message: "Invalid checksum"
            });
        }

        // 2️⃣ Decode response
        const decodedResponse = JSON.parse(Buffer.from(response, "base64").toString());
        console.log("📦 Decoded Response:", decodedResponse);

        const { merchantTransactionId, transactionId, amount, state, responseCode } = decodedResponse;

        // 3️⃣ Find payment record
        const payment = await Payment.findOne({ merchantTransactionId })
            .populate("subscriptionRequestId")
            .populate("planId");

        if (!payment) {
            console.error("❌ Payment not found:", merchantTransactionId);
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        // 4️⃣ Update payment status
        payment.phonePeTransactionId = transactionId;
        payment.phonePeResponse = decodedResponse;

        if (state === "COMPLETED" && responseCode === "SUCCESS") {
            payment.status = "success";
            payment.paidAt = new Date();

            // 5️⃣ Create/Activate Subscription
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + payment.planId.durationInDays);

            // Cancel existing active subscriptions for same module
            await Subscription.updateMany(
                {
                    userId: payment.userId,
                    moduleId: payment.moduleId,
                    status: "active"
                },
                { status: "cancelled" }
            );

            // Create new subscription
            const subscription = await Subscription.create({
                userId: payment.userId,
                moduleId: payment.moduleId,
                planId: payment.planId._id,
                startDate,
                endDate,
                status: "active",
                paymentId: payment.merchantTransactionId
            });

            payment.subscriptionId = subscription._id;

            // 6️⃣ Update subscription request
            const request = await SubscriptionRequest.findById(payment.subscriptionRequestId);
            if (request) {
                request.status = "approved";
                request.reviewedAt = new Date();
                request.reviewedBy = payment.adminId;
                request.adminNote = payment.adminNote || "Approved via payment";
                await request.save();
            }

            console.log("✅ Payment successful, subscription activated:", subscription._id);

        } else if (state === "FAILED") {
            payment.status = "failed";
            console.log("❌ Payment failed:", responseCode);
        } else {
            payment.status = "cancelled";
            console.log("⚠️ Payment cancelled or pending");
        }

        await payment.save();

        // 7️⃣ Acknowledge callback
        res.status(200).json({
            success: true,
            message: "Callback processed"
        });

    } catch (error) {
        console.error("Payment callback error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ======================================
 * CHECK PAYMENT STATUS
 * ======================================
 */
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { merchantTransactionId } = req.params;

        // 1️⃣ Find payment in database
        const payment = await Payment.findOne({ merchantTransactionId })
            .populate("subscriptionRequestId")
            .populate("planId")
            .populate("userId", "firstName lastName email")
            .populate("subscriptionId");

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        // 2️⃣ If payment is already completed, return from DB
        if (payment.status === "success" || payment.status === "failed") {
            return res.status(200).json({
                success: true,
                payment: {
                    id: payment._id,
                    merchantTransactionId: payment.merchantTransactionId,
                    phonePeTransactionId: payment.phonePeTransactionId,
                    amount: payment.amount,
                    currency: payment.currency,
                    status: payment.status,
                    paidAt: payment.paidAt,
                    subscription: payment.subscriptionId
                }
            });
        }

        // 3️⃣ Check status from PhonePe
        const statusResponse = await phonepeHelper.checkPaymentStatus(merchantTransactionId);

        // 4️⃣ Update payment based on PhonePe response
        if (statusResponse.success && statusResponse.data) {
            const { state, responseCode, transactionId } = statusResponse.data;

            payment.phonePeTransactionId = transactionId;
            payment.phonePeResponse = statusResponse.data;

            if (state === "COMPLETED" && responseCode === "SUCCESS") {
                payment.status = "success";
                payment.paidAt = new Date();

                // Create subscription if not already created
                if (!payment.subscriptionId) {
                    const startDate = new Date();
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + payment.planId.durationInDays);

                    await Subscription.updateMany(
                        {
                            userId: payment.userId,
                            moduleId: payment.moduleId,
                            status: "active"
                        },
                        { status: "cancelled" }
                    );

                    const subscription = await Subscription.create({
                        userId: payment.userId,
                        moduleId: payment.moduleId,
                        planId: payment.planId._id,
                        startDate,
                        endDate,
                        status: "active",
                        paymentId: payment.merchantTransactionId
                    });

                    payment.subscriptionId = subscription._id;

                    // Update subscription request
                    const request = await SubscriptionRequest.findById(payment.subscriptionRequestId);
                    if (request) {
                        request.status = "approved";
                        request.reviewedAt = new Date();
                        request.reviewedBy = payment.adminId;
                        await request.save();
                    }
                }
            } else if (state === "FAILED") {
                payment.status = "failed";
            }

            await payment.save();
        }

        res.status(200).json({
            success: true,
            payment: {
                id: payment._id,
                merchantTransactionId: payment.merchantTransactionId,
                phonePeTransactionId: payment.phonePeTransactionId,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                paidAt: payment.paidAt,
                subscription: payment.subscriptionId
            }
        });

    } catch (error) {
        console.error("Check payment status error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ======================================
 * GET ALL PAYMENTS (ADMIN)
 * ======================================
 */
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate("userId", "firstName lastName email")
            .populate("adminId", "firstName lastName email")
            .populate("planId", "name price durationInDays")
            .populate("moduleId", "title")
            .populate("subscriptionRequestId")
            .populate("subscriptionId")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            payments
        });
    } catch (error) {
        console.error("Get all payments error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ======================================
 * GET PAYMENT BY ID
 * ======================================
 */
exports.getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;

        const payment = await Payment.findById(id)
            .populate("userId", "firstName lastName email phone")
            .populate("adminId", "firstName lastName email")
            .populate("planId")
            .populate("moduleId")
            .populate("subscriptionRequestId")
            .populate("subscriptionId");

        if (!payment) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.status(200).json({
            success: true,
            payment
        });
    } catch (error) {
        console.error("Get payment by ID error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
