const razorpay = require("../../config/razorpay");
const crypto = require("crypto");
const Subscription = require("../../models/admin/Subscription");
const Plan = require("../../models/admin/Plan");

/**
 * =====================================================
 * CREATE RAZORPAY SUBSCRIPTION (LIVE SAFE)
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

    if (!customerEmail || !customerPhone) {
      return res.status(400).json({
        success: false,
        message: "Customer email and phone are required",
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // 🔒 HARD VALIDATIONS
    if (!plan.price || isNaN(plan.price)) {
      throw new Error("Invalid plan price");
    }

    if (!plan.durationInDays || isNaN(plan.durationInDays)) {
      throw new Error("Invalid plan duration");
    }

    const isLive = process.env.RAZORPAY_KEY_ID.startsWith("rzp_live");

    // 🔁 Pick correct Razorpay plan ID (TEST vs LIVE)
    let razorpayPlanId = isLive
      ? plan.razorpayPlanIdLive
      : plan.razorpayPlanIdTest;

    /**
     * =====================================================
     * CREATE RAZORPAY PLAN IF NOT EXISTS
     * =====================================================
     */
    if (!razorpayPlanId) {
      let razorpayPlan;

      try {
        razorpayPlan = await razorpay.plans.create({
          period: plan.planType === "monthly" ? "monthly" : "yearly",
          interval: 1,
          item: {
            name: plan.name,
            amount: Math.round(Number(plan.price) * 100),
            currency: "INR", // ⚠️ Must match Razorpay account country
            description: `Subscription for ${plan.name}`,
          },
        });
      } catch (e) {
        console.error("🔥 Razorpay PLAN creation failed:", e?.error || e);
        throw new Error(
          e?.error?.description || "Razorpay plan creation failed"
        );
      }

      if (isLive) {
        plan.razorpayPlanIdLive = razorpayPlan.id;
      } else {
        plan.razorpayPlanIdTest = razorpayPlan.id;
      }

      await plan.save();
      razorpayPlanId = razorpayPlan.id;

      console.log("✅ Razorpay Plan Created:", razorpayPlanId);
    }

    const totalCount = Math.max(
      1,
      Math.ceil(plan.durationInDays / 30)
    );

    /**
     * =====================================================
     * CREATE SUBSCRIPTION
     * =====================================================
     */
    let razorpaySubscription;

    try {
      razorpaySubscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        customer_notify: 1,
        total_count: totalCount,
        notify_info: {
          notify_email: customerEmail,
          notify_phone: customerPhone,
        },
      });
    } catch (e) {
      console.error("🔥 Razorpay SUBSCRIPTION failed:", e?.error || e);
      throw new Error(
        e?.error?.description || "Razorpay subscription creation failed"
      );
    }

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
    console.error("❌ createSubscription ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * =====================================================
 * VERIFY RAZORPAY SUBSCRIPTION PAYMENT
 * =====================================================
 */
exports.verifySubscription = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay verification fields",
      });
    }

    // 🔐 Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(
        razorpay_payment_id + "|" + razorpay_subscription_id
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

    // ❌ Cancel previous subscriptions (same module)
    await Subscription.updateMany(
      {
        userId: subscription.userId,
        moduleId: subscription.moduleId,
        _id: { $ne: subscription._id },
      },
      {
        status: "cancelled",
        isCurrent: false,
      }
    );

    // ✅ Activate
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(
      endDate.getDate() + subscription.planId.durationInDays
    );

    subscription.status = "active";
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.paymentId = razorpay_payment_id;
    subscription.razorpayPaymentId = razorpay_payment_id;
    subscription.isCurrent = true;

    await subscription.save();

    return res.json({
      success: true,
      message: "Subscription activated successfully",
      subscription,
    });
  } catch (err) {
    console.error("❌ verifySubscription ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
