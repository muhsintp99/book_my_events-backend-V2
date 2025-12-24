const SubscriptionRequest = require("../../models/admin/SubscriptionRequest");
const Subscription = require("../../models/admin/Subscription");
const Plan = require("../../models/admin/Plan");

/**
 * ======================================
 * GET ALL SUBSCRIPTION REQUESTS (ADMIN)
 * ======================================
 */
exports.getRequests = async (req, res) => {
  try {
    const requests = await SubscriptionRequest.find()
      .populate("userId", "firstName lastName email phone")
      .populate("vendorProfileId")
      .populate("moduleId", "title icon")
      .populate("planId", "name price durationInDays")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    console.error("Get requests error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * ======================================
 * APPROVE SUBSCRIPTION REQUEST (ADMIN)
 * ======================================
 */
exports.approveRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    const request = await SubscriptionRequest.findById(requestId)
      .populate("planId");

    // ❌ Invalid request
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Subscription request not found"
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Subscription request already processed"
      });
    }

    // 1️⃣ Cancel existing ACTIVE subscription for same module
    await Subscription.updateMany(
      {
        userId: request.userId,
        moduleId: request.moduleId,
        status: "active"
      },
      { status: "cancelled" }
    );

    // 2️⃣ Create new ACTIVE subscription
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + request.planId.durationInDays);

    const subscription = await Subscription.create({
      userId: request.userId,
      moduleId: request.moduleId,
      planId: request.planId._id,
      startDate,
      endDate,
      status: "active"
    });

    // 3️⃣ Update request status
    request.status = "approved";
    request.reviewedAt = new Date();
    request.reviewedBy = req.user?._id || null;
    await request.save();

    res.status(200).json({
      success: true,
      message: "Subscription approved and activated",
      subscription
    });

  } catch (error) {
    console.error("Approve request error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * ======================================
 * REJECT SUBSCRIPTION REQUEST (ADMIN)
 * ======================================
 */
exports.rejectRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const { adminNote } = req.body;

    const request = await SubscriptionRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Subscription request not found"
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Subscription request already processed"
      });
    }

    request.status = "rejected";
    request.adminNote = adminNote || "";
    request.reviewedAt = new Date();
    request.reviewedBy = req.user?._id || null;

    await request.save();

    res.status(200).json({
      success: true,
      message: "Subscription request rejected",
      request
    });

  } catch (error) {
    console.error("Reject request error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
