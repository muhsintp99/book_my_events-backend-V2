const SubscriptionRequest = require("../../models/admin/SubscriptionRequest");
const User = require("../../models/User");

exports.createSubscriptionRequest = async (req, res) => {
  try {
    const { userId, moduleId, planId, vendorProfileId } = req.body;

    // 1️⃣ Validate vendor
    const user = await User.findById(userId);
    if (!user || user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Only vendors can request subscriptions"
      });
    }

    // 2️⃣ Prevent duplicate pending requests
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

    // 3️⃣ Create request
    const request = await SubscriptionRequest.create({
      userId,
      moduleId,
      planId,
      vendorProfileId
    });

    res.status(201).json({
      success: true,
      message: "Subscription request submitted successfully",
      request
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
