const Subscription = require("../models/Subscription");

module.exports = async (req, res, next) => {
  try {
    const userId = req.user.id; // JWT required

    const subscription = await Subscription.findOne({ userId });

    if (!subscription)
      return res.status(403).json({ message: "Subscription required" });

    if (subscription.status !== "active")
      return res.status(403).json({ message: "Subscription is not active" });

    if (new Date() > new Date(subscription.endDate)) {
      subscription.status = "expired";
      await subscription.save();
      return res.status(403).json({ message: "Subscription expired" });
    }

    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
