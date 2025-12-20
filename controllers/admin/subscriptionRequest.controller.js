const Subscription = require("../../models/admin/Subscription");
const Plan = require("../../models/admin/Plan");

exports.approveRequest = async (req, res) => {
  try {
    const request = await SubscriptionRequest.findById(req.params.id)
      .populate("planId");

    if (!request || request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription request"
      });
    }

    // Cancel existing active subscription for same module
    await Subscription.updateMany(
      { userId: request.userId, moduleId: request.moduleId, status: "active" },
      { status: "cancelled" }
    );

    // Create active subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + request.planId.durationInDays);

    await Subscription.create({
      userId: request.userId,
      moduleId: request.moduleId,
      planId: request.planId._id,
      startDate,
      endDate,
      status: "active"
    });

    // Update request status
    request.status = "approved";
    request.reviewedAt = new Date();
    request.reviewedBy = req.user._id;
    await request.save();

    res.json({
      success: true,
      message: "Subscription approved and activated"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



const SubscriptionRequest = require("../../models/admin/SubscriptionRequest");

exports.getRequests = async (req, res) => {
  try {
    const requests = await SubscriptionRequest.find()
      .populate("userId", "firstName lastName email phone")
      .populate("vendorProfileId")
      .populate("moduleId", "title icon")
      .populate("planId", "name price durationInDays")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



exports.rejectRequest = async (req, res) => {
  try {
    const request = await SubscriptionRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        adminNote: req.body.adminNote,
        reviewedAt: new Date(),
        reviewedBy: req.user._id
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Subscription request rejected",
      request
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
