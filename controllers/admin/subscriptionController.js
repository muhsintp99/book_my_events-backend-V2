const Plan = require("../../models/admin/Plan");
const Subscription = require("../../models/admin/Subscription");


// --------------------------------------------------------
// CREATE PLAN
// --------------------------------------------------------
// exports.createPlan = async (req, res) => {
//   try {
//     const plan = await Plan.create(req.body);
//     res.status(201).json({ success: true, plan });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// controllers/subscriptionController.js

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { moduleId } = req.query;

    if (!userId || !moduleId) {
      return res.status(400).json({
        success: false,
        message: "userId and moduleId are required"
      });
    }

    // ✅ STRICT: only ACTIVE + CURRENT subscription
    const subscription = await Subscription.findOne({
      userId,
      moduleId,
      status: "active",
      isCurrent: true
    })
      .populate("planId")
      .populate("moduleId", "title icon");

    return res.json({
      success: true,
      subscription: subscription || null
    });

  } catch (err) {
    console.error("Subscription status error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch subscription"
    });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const {
      moduleId,
      name,
      description,
      price,
      currency,
      durationInDays,
      planBenefits,
      features,
      maxUploads,
      maxStorage,
      storageUnit,
      allowedProducts,
      allowedMembers,
      discount,
      tags,
      isPopular,
      isActive,
      trialAvailable,
      planType
    } = req.body;

    if (durationInDays !== 365) {
      return res.status(400).json({
        success: false,
        message: "Only yearly (365 days) subscriptions allowed"
      });
    }

    const plan = await Plan.create({
      moduleId,
      name,
      description,
      price,
      currency,
      durationInDays,
      planBenefits,
      features,
      maxUploads,
      maxStorage,
      storageUnit,
      allowedProducts,
      allowedMembers,
      discount,
      tags,
      isPopular,
      isActive,
      trialAvailable,
      planType
    });

    res.status(201).json({ success: true, plan });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// --------------------------------------------------------
// GET ALL PLANS
// --------------------------------------------------------
// exports.getPlans = async (req, res) => {
//   try {
//     const plans = await Plan.find().sort({ price: 1 });
//     res.json({ success: true, plans });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };



exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find()
      .populate("moduleId", "title icon") // NOW VALID
      .lean();

    for (let plan of plans) {
      plan.subscriberCount = await Subscription.countDocuments({ planId: plan._id });
    }

    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};




// --------------------------------------------------------
// USER SUBSCRIBE TO A PLAN (WITH MODULE ID)
// --------------------------------------------------------
exports.subscribeUser = async (req, res) => {
  try {
    const { userId, planId, moduleId, paymentId } = req.body;

    // 1️⃣ Validation
    if (!userId || !planId || !moduleId || !paymentId) {
      return res.status(400).json({
        success: false,
        message: "userId, planId, moduleId, paymentId are required"
      });
    }

    // 2️⃣ Check plan exists
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found"
      });
    }

    // 3️⃣ Cancel previous active subscription for this module
    // await Subscription.updateMany(
    //   { userId, moduleId, status: "active" },
    //   { status: "cancelled" }
    // );

    // 4️⃣ CREATE SUBSCRIPTION (PENDING)
    const subscription = await Subscription.create({
      userId,
      planId,
      moduleId,
      paymentId,
      status: "pending" // ✅ VERY IMPORTANT
    });

    const populated = await Subscription.findById(subscription._id)
      .populate("planId")
      .populate("moduleId", "title icon");

    return res.status(201).json({
      success: true,
      message: "Subscription created. Waiting for payment verification.",
      subscription: populated
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};




// --------------------------------------------------------
// GET PLANS BY MODULE ID
// --------------------------------------------------------
exports.getPlansByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!moduleId) {
      return res.status(400).json({
        success: false,
        message: "moduleId is required"
      });
    }

    const plans = await Plan.find({ moduleId })
      .populate("moduleId", "title icon")
      .lean();

    res.json({
      success: true,
      plans
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



// --------------------------------------------------------
// DELETE PLAN
// --------------------------------------------------------
exports.deletePlan = async (req, res) => {
  try {
    await Plan.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Plan deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSinglePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id).populate("moduleId");

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.json({
      success: true,
      message: "Plan updated successfully",
      plan: updatedPlan,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------
// GET USER SUBSCRIPTION STATUS
// --------------------------------------------------------
// exports.getUserSubscription = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     const subscription = await Subscription.findOne({ userId })
//       .populate("planId")
//       .populate("moduleId", "title icon");

//     if (!subscription) {
//       return res.status(404).json({ success: false, message: "No subscription found" });
//     }

//     res.json({ success: true, subscription });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// --------------------------------------------------------
// UPGRADE PLAN
// --------------------------------------------------------
// exports.upgradePlan = async (req, res) => {
//   try {
//     const { userId, planId, moduleId, paymentSession, paymentId } = req.body;

//     if (!userId || !planId || !moduleId) {
//       return res.status(400).json({
//         success: false,
//         message: "userId, planId, and moduleId are required"
//       });
//     }

//     // paymentSession OR paymentId required
//     if (!paymentSession && !paymentId) {
//       return res.status(400).json({
//         success: false,
//         message: "paymentSession or paymentId is required"
//       });
//     }

//     // 1️⃣ Cancel existing active subscription
//     await Subscription.updateMany(
//       { userId, moduleId, status: "active" },
//       { status: "cancelled" }
//     );

//     // 2️⃣ Validate plan
//     const plan = await Plan.findById(planId);
//     if (!plan) {
//       return res.status(404).json({
//         success: false,
//         message: "Plan not found"
//       });
//     }

//     // 3️⃣ Create PENDING subscription
//     const subscription = await Subscription.create({
//       userId,
//       planId,
//       moduleId,
//       paymentId: paymentSession?.order_id || paymentId,
//       paymentSession: paymentSession || null,
//       status: "pending"
//     });

//     const populated = await Subscription.findById(subscription._id)
//       .populate("planId")
//       .populate("moduleId", "title icon");

//     res.status(200).json({
//       success: true,
//       message: "Payment initiated. Complete payment to activate plan.",
//       subscription: populated,
//       payment: paymentSession || { paymentId }
//     });

//   } catch (err) {
//     console.error("Upgrade error:", err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// };

exports.upgradePlan = async (req, res) => {
  try {
    const { userId, planId, moduleId, paymentSession } = req.body;

    if (!userId || !planId || !moduleId || !paymentSession?.order_id) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // ❌ Deactivate ALL previous subscriptions for this module
    // await Subscription.updateMany(
    //   { userId, moduleId },
    //   { status: "cancelled", isCurrent: false }
    // );

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });

    const subscription = await Subscription.create({
      userId,
      planId,
      moduleId,
      paymentId: paymentSession.order_id,
      paymentSession,
      status: "pending",
      isCurrent: false  
    });

    res.json({
      success: true,
      message: "Payment initiated",
      subscription
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.paymentSuccess = async (req, res) => {
  try {
    const { orderId } = req.query;

    const subscription = await Subscription.findOne({
      paymentId: orderId,
      status: "pending"
    }).populate("planId");

    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    // Cancel others
    await Subscription.updateMany(
      {
        userId: subscription.userId,
        moduleId: subscription.moduleId,
        _id: { $ne: subscription._id }
      },
      { status: "cancelled", isCurrent: false }
    );

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + subscription.planId.durationInDays);

    subscription.status = "active";
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.isCurrent = true;

    await subscription.save();

    res.json({
      success: true,
      message: "Plan upgraded successfully",
      subscription
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.juspayWebhook = async (req, res) => {
  if (status === "CHARGED") {
    subscription.status = "active";
    subscription.isCurrent = true;
    await subscription.save();
  }
};

// --------------------------------------------------------
// CANCEL SUBSCRIPTION
// --------------------------------------------------------
exports.cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { status: "cancelled" },
      { new: true }
    ).populate("moduleId", "title icon");

    res.json({ success: true, subscription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// --------------------------------------------------------
// GET ALL SUBSCRIPTIONS (ADMIN)
// --------------------------------------------------------
exports.getAllSubscriptions = async (req, res) => {
  try {
    const subs = await Subscription.find()
      .populate("userId")
      .populate("planId")
      .populate("moduleId", "title icon")
      .sort({ createdAt: -1 });

    res.json({ success: true, subscriptions: subs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// --------------------------------------------------------
// UPDATE SUBSCRIPTION (ADMIN)
// --------------------------------------------------------
exports.updateSubscription = async (req, res) => {
  try {
    const updated = await Subscription.findByIdAndUpdate(
      req.params.subscriptionId,
      req.body,
      { new: true }
    )
      .populate("planId")
      .populate("moduleId", "title icon");

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
