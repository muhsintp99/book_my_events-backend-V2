const SubscriptionRequest = require("../../models/admin/SubscriptionRequest");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const Plan = require("../../models/admin/Plan");

exports.createSubscriptionRequest = async (req, res) => {
  try {
    /**
     * SUPPORT BOTH MODES
     * ------------------
     * 1) If token exists → use req.user._id
     * 2) If no token → require userId from body
     */

    let userId = null;

    // 🔐 Token mode
    if (req.user && req.user._id) {
      userId = req.user._id;
    }

    // 🟡 No-token mode
    if (!userId && req.body.userId) {
      userId = req.body.userId;
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required (token or body)"
      });
    }

    const { moduleId, planId, vendorProfileId } = req.body;

    // 1️⃣ Validate user
    const user = await User.findById(userId).select("role");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Only vendors can request subscriptions"
      });
    }

    // 2️⃣ Validate vendorProfileId ONLY if provided
    if (vendorProfileId) {
      const profile = await VendorProfile.findOne({
        _id: vendorProfileId,
        user: userId
      });

      if (!profile) {
        return res.status(403).json({
          success: false,
          message: "Vendor profile does not belong to this user"
        });
      }
    }

    // 3️⃣ Prevent duplicate pending request per module
    const existingRequest = await SubscriptionRequest.findOne({
      userId,
      moduleId,
      status: "pending"
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Subscription request already pending for this module"
      });
    }

    // 4️⃣ Get plan for moduleModel
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    // 4️⃣ Create request
    const request = await SubscriptionRequest.create({
      userId,
      moduleId,
      moduleModel: plan.moduleModel || 'Module',
      planId,
      vendorProfileId: vendorProfileId || null
    });

    return res.status(201).json({
      success: true,
      message: "Subscription request submitted successfully",
      request
    });

  } catch (error) {
    console.error("Subscription request error:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
