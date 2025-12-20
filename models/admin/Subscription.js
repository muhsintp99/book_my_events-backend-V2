// const mongoose = require("mongoose");

// const subscriptionSchema = new mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan", required: true },

//     moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },

//     startDate: { type: Date, required: true },
//     endDate: { type: Date, required: true },

//     status: {
//       type: String,
//       enum: ["active", "expired", "cancelled", "trial"],
//       default: "active",
//     },

//     paymentId: { type: String },
//     autoRenew: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Subscription", subscriptionSchema);
const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true
    },

    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true
    },

    // ✅ NOT required initially
    startDate: {
      type: Date
    },

    // ✅ NOT required initially
    endDate: {
      type: Date
    },

    // ✅ ADD pending
    status: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled", "trial"],
      default: "pending"
    },

    // 🔑 Used to map payment → subscription
    paymentId: {
      type: String,
      required: true
    },

    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
