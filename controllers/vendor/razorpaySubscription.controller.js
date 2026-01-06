const razorpay = require("../../config/razorpay");
const crypto = require("crypto");
const Subscription = require("../../models/admin/Subscription");
const Plan = require("../../models/admin/Plan");

/**
 * =====================================================
 * CREATE RAZORPAY SUBSCRIPTION (TEST & LIVE SAFE)
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

    // 🔑 Detect Razorpay mode
    const isTestMode = process.env.RAZORPAY_KEY_ID.startsWith("rzp_test_");
    const razorpayPlanField = isTestMode
      ? "razorpayPlanIdTest"
      : "razorpayPlanIdLive";

    console.log("🔑 Razorpay Key:", process.env.RAZORPAY_KEY_ID);
    console.log("🧪 Razorpay Mode:", isTestMode ? "TEST MODE" : "LIVE MODE");

    // 1️⃣ Fetch plan
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    // 2️⃣ Auto-create Razorpay Plan (MODE SAFE)
    if (!plan[razorpayPlanField]) {
      let razorpayPlan;

      try {
        razorpayPlan = await razorpay.plans.create({
          period: plan.planType === "monthly" ? "monthly" : "yearly",
          interval: 1,
          item: {
            name: plan.name,
            amount: plan.price * 100, // paise
            currency: plan.currency || "INR",
            description: `Auto plan for ${plan.name}`,
          },
        });
      } catch (err) {
        console.error("❌ Razorpay plan creation failed:", err);
        return res.status(500).json({
          success: false,
          message: "Razorpay plan creation failed",
          error: err?.error || err?.message,
        });
      }

      plan[razorpayPlanField] = razorpayPlan.id;
      await plan.save();

      console.log(
        `✅ Razorpay ${isTestMode ? "TEST" : "LIVE"} plan created:`,
        razorpayPlan.id
      );
    }

    // 3️⃣ Create Razorpay Subscription
    let razorpaySubscription;
    try {
      razorpaySubscription = await razorpay.subscriptions.create({
        plan_id: plan[razorpayPlanField],
        customer_notify: 1,
        total_count: Math.ceil(plan.durationInDays / 30),
      });
    } catch (err) {
      console.error("❌ Razorpay subscription creation failed:", err);
      return res.status(500).json({
        success: false,
        message: "Razorpay subscription creation failed",
        error: err?.error || err?.message,
      });
    }

    // 4️⃣ Save subscription in DB (PENDING)
    const subscription = await Subscription.create({
      userId: providerId,
      planId: plan._id,
      moduleId: plan.moduleId,
      razorpaySubscriptionId: razorpaySubscription.id,
      status: "pending",
      isCurrent: false,
      mode: isTestMode ? "test" : "live",
    });

    // 5️⃣ Response to frontend
    return res.json({
      success: true,
      message: "Subscription created successfully",

      razorpay: {
        key: process.env.RAZORPAY_KEY_ID,
        subscriptionId: razorpaySubscription.id,
      },

      subscriptionDbId: subscription._id,

      plan: {
        id: plan._id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        durationInDays: plan.durationInDays,
        planType: plan.planType,
      },

      customer: {
        email: customerEmail,
        phone: customerPhone,
      },
    });
  } catch (err) {
    console.error("❌ createSubscription error:", err);
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

    // 1️⃣ Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay signature",
      });
    }

    // 2️⃣ Find subscription
    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: razorpay_subscription_id,
    }).populate("planId");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // 3️⃣ Cancel previous subscriptions (same user + module)
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

    // 4️⃣ Activate subscription
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
    console.error("❌ verifySubscription error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
