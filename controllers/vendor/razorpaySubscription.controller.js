const razorpay = require("../../config/razorpay");
const crypto = require("crypto");
const Subscription = require("../../models/admin/Subscription");
const Plan = require("../../models/admin/Plan");



/**
 * =====================================================
 * CREATE RAZORPAY SUBSCRIPTION (NO PAYMENT YET)
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

    // 1️⃣ Fetch plan from DB
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    /**
     * 2️⃣ AUTO-CREATE RAZORPAY PLAN (TEST MODE SAFE)
     *    ✅ THIS IS THE CORRECT PLACE
     */
    if (!plan.razorpayPlanId) {
      const razorpayPlan = await razorpay.plans.create({
        period: plan.planType === "monthly" ? "monthly" : "yearly",
        interval: 1,
        item: {
          name: plan.name,
          amount: plan.price * 100, // paise
          currency: plan.currency || "INR",
          description: `Auto plan for ${plan.name}`,
        },
      });

      plan.razorpayPlanId = razorpayPlan.id;
      await plan.save();

      console.log("✅ Razorpay plan auto-created:", razorpayPlan.id);
    }

    // 3️⃣ Create Razorpay subscription
    const razorpaySubscription = await razorpay.subscriptions.create({
      plan_id: plan.razorpayPlanId,
      customer_notify: 1,
      total_count: Math.ceil(plan.durationInDays / 30),
    });

    // 4️⃣ Save subscription in DB
    const subscription = await Subscription.create({
      userId: providerId,
      planId: plan._id,
      moduleId: plan.moduleId,
      razorpaySubscriptionId: razorpaySubscription.id,
      status: "pending",
      isCurrent: false,
    });

    // 5️⃣ Respond
   return res.json({
  success: true,
  message: "Subscription plan created successfully",

  plan: {
    id: plan._id,
    name: plan.name,
    price: plan.price,
    currency: plan.currency,
    durationInDays: plan.durationInDays,
    planType: plan.planType,
  },

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
    subscription.paymentId = razorpay_payment_id;        // ✅ now saved AFTER payment
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
