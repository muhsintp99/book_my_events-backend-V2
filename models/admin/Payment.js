const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        // PhonePe transaction ID
        phonePeTransactionId: {
            type: String,
            unique: true,
            sparse: true
        },

        // Our unique merchant transaction ID
        merchantTransactionId: {
            type: String,
            required: true,
            unique: true
        },

        // Reference to subscription request
        subscriptionRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubscriptionRequest",
            required: true
        },

        // Vendor user who will receive the subscription
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Admin who initiated the payment
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Plan details
        planId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plan",
            required: true
        },

        // Module details
        moduleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Module",
            required: true
        },

        // Payment amount
        amount: {
            type: Number,
            required: true
        },

        // Currency (default INR)
        currency: {
            type: String,
            default: "INR"
        },

        // Payment status
        status: {
            type: String,
            enum: ["pending", "success", "failed", "cancelled"],
            default: "pending"
        },

        // PhonePe payment method
        paymentMethod: {
            type: String
        },

        // PhonePe response data
        phonePeResponse: {
            type: mongoose.Schema.Types.Mixed
        },

        // Payment URL from PhonePe
        paymentUrl: {
            type: String
        },

        // Created subscription ID (after successful payment)
        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscription"
        },

        // Payment completed timestamp
        paidAt: {
            type: Date
        },

        // Admin note
        adminNote: {
            type: String
        }
    },
    { timestamps: true }
);

// Index for faster queries
paymentSchema.index({ merchantTransactionId: 1 });
paymentSchema.index({ subscriptionRequestId: 1 });
paymentSchema.index({ userId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model("Payment", paymentSchema);
