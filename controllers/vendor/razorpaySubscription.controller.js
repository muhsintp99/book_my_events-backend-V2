// controllers/vendor/razorpaySubscription.controller.js

const razorpay = require("../../config/razorpay");
const crypto = require("crypto");
const Subscription = require("../../models/admin/Subscription");
const Plan = require("../../models/admin/Plan");

/**
 * =====================================================
 * CREATE RAZORPAY SUBSCRIPTION
 * =====================================================
 */
exports.createSubscription = async (req, res) => {
  try {
    const { providerId, planId, customerEmail, customerPhone } = req.body;

    if (!providerId || !planId) {
      return res.status(400).json({
        success: false,
        message: "providerId and planId are required",
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    console.log("🧪 Razorpay Mode:",
      process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_") ? "TEST" : "LIVE"
    );

    /**
     * 1️⃣ Create Razorpay Plan if missing
     */
    if (!plan.razorpayPlanId) {
      const razorpayPlan = await razorpay.plans.create({
        period: plan.planType === "monthly" ? "monthly" : "yearly",
        interval: 1,
        item: {
          name: plan.name,
          amount: plan.price * 100, // ₹ → paise
          currency: "INR",
          description: `${plan.name} (${plan.planType})`,
        },
      });

      plan.razorpayPlanId = razorpayPlan.id;
      await plan.save();

      console.log("✅ Razorpay plan created:", razorpayPlan.id);
    }

    /**
     * 2️⃣ Create Razorpay Subscription
     * IMPORTANT:
     * - monthly → total_count = 12 (1 year)
     * - yearly  → total_count = 1
     */
    const totalCount =
      plan.planType === "monthly" ? 12 : 1;

    const razorpaySubscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      total_count: totalCount,
      customer_notify: 1,
    });

    console.log("✅ Razorpay subscription created:", razorpaySubscription.id);

    /**
     * 3️⃣ Save in DB
     */
    const subscription = await Subscription.create({
      userId: providerId,
      planId: plan._id,
      moduleId: plan.moduleId,
      razorpaySubscriptionId: razorpaySubscription.id,
      status: "pending",
      isCurrent: false,
    });

    return res.json({
      success: true,
      razorpay: {
        key: process.env.RAZORPAY_KEY_ID,
        subscriptionId: razorpaySubscription.id,
      },
      subscriptionDbId: subscription._id,
      customer: {
        email: customerEmail,
        phone: customerPhone,
      },
    });

  } catch (err) {
    console.error("❌ FULL RAZORPAY ERROR:");
    console.error(JSON.stringify(err, null, 2));

    return res.status(500).json({
      success: false,
      message: "Razorpay subscription creation failed",
      error: err?.error || err?.message,
    });
  }
};

/**
 * =====================================================
 * VERIFY SUBSCRIPTION PAYMENT
 * =====================================================
 */
exports.verifySubscription = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        `${razorpay_payment_id}|${razorpay_subscription_id}`
      )
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay signature",
      });
    }

    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: razorpay_subscription_id,
    }).populate("planId");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // cancel previous
    await Subscription.updateMany(
      {
        userId: subscription.userId,
        moduleId: subscription.moduleId,
        _id: { $ne: subscription._id },
      },
      { status: "cancelled", isCurrent: false }
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(
      endDate.getDate() + subscription.planId.durationInDays
    );

    subscription.status = "active";
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.razorpayPaymentId = razorpay_payment_id;
    subscription.isCurrent = true;

    await subscription.save();

    return res.json({
      success: true,
      message: "Subscription activated successfully",
      subscription,
    });

  } catch (err) {
    console.error("❌ verifySubscription error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
