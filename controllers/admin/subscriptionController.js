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


exports.createPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency,
      durationInDays,
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

    // Only yearly allowed → 365 days
    if (durationInDays !== 365) {
      return res.status(400).json({
        success: false,
        message: "Only yearly (365 days) subscriptions allowed"
      });
    }

    const plan = await Plan.create({
      name,
      description,
      price,
      currency,
      durationInDays,
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
      .populate("moduleId", "title icon")
      .lean();

    for (let plan of plans) {
      const count = await Subscription.countDocuments({ planId: plan._id });
      plan.subscriberCount = count;
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

    if (!moduleId) {
      return res.status(400).json({ success: false, message: "moduleId is required" });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationInDays);

    const subscription = await Subscription.create({
      userId,
      planId,
      moduleId,
      startDate,
      endDate,
      paymentId,
      status: "active"
    });

    // Populate module title + icon + plan details
    const populated = await Subscription.findById(subscription._id)
      .populate("planId")
      .populate("moduleId", "title icon");

    res.status(201).json({
      success: true,
      subscription: populated,
      message: "Subscription activated successfully"
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


// --------------------------------------------------------
// GET USER SUBSCRIPTION STATUS
// --------------------------------------------------------
exports.getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const subscription = await Subscription.findOne({ userId })
      .populate("planId")
      .populate("moduleId", "title icon");

    if (!subscription) {
      return res.status(404).json({ success: false, message: "No subscription found" });
    }

    res.json({ success: true, subscription });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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
