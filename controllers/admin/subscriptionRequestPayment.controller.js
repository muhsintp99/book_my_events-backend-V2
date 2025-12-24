const SubscriptionRequest = require("../../models/admin/SubscriptionRequest");
const Subscription = require("../../models/admin/Subscription");
const Plan = require("../../models/admin/Plan");
const User = require("../../models/User");
const { Juspay } = require("expresscheckout-nodejs");
const config = require("../../config/smartgateway_config.json");

const juspay = new Juspay({
    merchantId: config.MERCHANT_ID,
    baseUrl: config.BASE_URL,
    apiKey: config.API_KEY,
});

console.log("✅ HDFC Subscription Request Payment initialized");

/**
 * INITIATE PAYMENT FOR SUBSCRIPTION REQUEST (ADMIN)
 */
exports.initiateSubscriptionRequestPayment = async (req, res) => {
    try {
        const { requestId, adminNote } = req.body;
        const adminId = req.user?._id;

        console.log("📥 Initiate payment request:", { requestId, adminId });

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });
        }

        // Validate subscription request
        const request = await SubscriptionRequest.findById(requestId)
            .populate("planId")
            .populate("userId", "firstName lastName email mobile")
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
                message: `Subscription request already ${request.status}`
            });
        }

        const plan = request.planId;
        const user = request.userId;
        const orderId = `subreq_${Date.now()}`;
        const amountInRupees = Number(plan.price).toFixed(2);

        console.log("📋 Payment details:", {
            orderId,
            amount: amountInRupees,
            plan: plan.name,
            user: user.email
        });

        const returnUrl = `https://admin.bookmyevent.ae/subscriptions/payment-success?orderId=${orderId}&requestId=${requestId}`;

        // Create pending subscription linked to request
        const subscription = await Subscription.create({
            userId: user._id,
            planId: plan._id,
            moduleId: request.moduleId._id,
            paymentId: orderId,
            status: "pending",
            isCurrent: false,
            subscriptionRequestId: requestId // Link to request
        });

        console.log("✅ Pending subscription created:", subscription._id);

        // Create Juspay Order
        await juspay.order.create({
            order_id: orderId,
            amount: amountInRupees,
            currency: "INR",
            customer_id: user._id.toString(),
            customer_email: user.email,
            customer_phone: user.mobile || "9999999999",
            description: `Subscription: ${plan.name} - ₹${amountInRupees}`,
            return_url: returnUrl,
        });

        console.log("✅ Juspay order created");

        // Create Payment Session
        const session = await juspay.orderSession.create({
            order_id: orderId,
            action: "paymentPage",
            amount: amountInRupees,
            currency: "INR",
            customer_id: user._id.toString(),
            customer_email: user.email,
            customer_phone: user.mobile || "9999999999",
            payment_page_client_id: "hdfcmaster",
            return_url: returnUrl,
            redirect: true,
            auto_redirect: true,
            description: `Subscription: ${plan.name} - ₹${amountInRupees}`,
        });

        console.log("✅ Payment session created");
        console.log("🎯 Payment URL:", session.payment_links?.web);

        // Update subscription request with admin note
        if (adminNote) {
            request.adminNote = adminNote;
            request.reviewedBy = adminId;
            await request.save();
        }

        return res.json({
            success: true,
            order_id: orderId,
            amount: amountInRupees,
            requestId: requestId,
            plan: {
                id: plan._id,
                name: plan.name,
                durationInDays: plan.durationInDays
            },
            payment_links: session.payment_links,
            return_url: returnUrl,
        });

    } catch (error) {
        console.error("❌ Subscription request payment error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Payment creation failed",
            error: error.response?.data || error.toString()
        });
    }
};

/**
 * VERIFY PAYMENT AND ACTIVATE SUBSCRIPTION
 */
exports.verifySubscriptionRequestPayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        console.log("🔍 Verifying payment for orderId:", orderId);

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "orderId is required"
            });
        }

        // Find subscription
        const subscription = await Subscription.findOne({
            paymentId: orderId
        }).populate("planId").populate("subscriptionRequestId");

        if (!subscription) {
            console.log("❌ Subscription not found for orderId:", orderId);
            return res.json({
                success: false,
                message: "Invalid order"
            });
        }

        console.log("📋 Subscription found:", {
            id: subscription._id,
            status: subscription.status,
            requestId: subscription.subscriptionRequestId?._id
        });

        // If already active, return success
        if (subscription.status === "active") {
            console.log("✅ Subscription already active");
            return res.json({
                success: true,
                subscription,
                message: "Subscription is active"
            });
        }

        // Check payment status with Juspay
        console.log("🔄 Checking Juspay order status...");

        let juspayOrder;
        try {
            juspayOrder = await juspay.order.status(orderId);
            console.log("📊 Juspay order status:", juspayOrder.status);
        } catch (error) {
            console.error("❌ Juspay API error:", error.message);
            return res.json({
                success: false,
                status: subscription.status,
                message: "Unable to verify payment status"
            });
        }

        // Handle payment status
        if (juspayOrder.status === "CHARGED") {
            console.log("✅ Payment is CHARGED - Activating subscription");

            // Cancel all other subscriptions for this user+module
            await Subscription.updateMany(
                {
                    userId: subscription.userId,
                    moduleId: subscription.moduleId,
                    _id: { $ne: subscription._id }
                },
                {
                    status: "cancelled",
                    isCurrent: false
                }
            );

            // Activate subscription
            const plan = subscription.planId;
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + plan.durationInDays);

            subscription.status = "active";
            subscription.startDate = startDate;
            subscription.endDate = endDate;
            subscription.isCurrent = true;
            await subscription.save();

            console.log("✅ Subscription activated successfully");

            // Update subscription request to approved
            if (subscription.subscriptionRequestId) {
                const request = await SubscriptionRequest.findById(subscription.subscriptionRequestId);
                if (request) {
                    request.status = "approved";
                    request.reviewedAt = new Date();
                    await request.save();
                    console.log("✅ Subscription request approved");
                }
            }

            return res.json({
                success: true,
                subscription,
                message: "Payment successful, subscription activated"
            });

        } else if (["PENDING", "PENDING_VBV", "AUTHORIZING", "NEW"].includes(juspayOrder.status)) {
            console.log("⏳ Payment is pending:", juspayOrder.status);

            return res.json({
                success: false,
                status: "pending",
                message: "Payment is being processed. Please wait..."
            });

        } else {
            // Payment failed
            console.log("❌ Payment failed:", juspayOrder.status);

            subscription.status = "cancelled";
            await subscription.save();

            return res.json({
                success: false,
                status: "failed",
                message: "Payment failed"
            });
        }

    } catch (error) {
        console.error("❌ Verify payment error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Payment verification failed"
        });
    }
};
