// const mongoose = require("mongoose");

// const planSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     price: { type: Number, required: true },
//     durationInDays: { type: Number, required: true }, // 30, 365

//     features: [{ type: String }],
//     maxUploads: { type: Number, default: 10 },
//     maxStorage: { type: Number, default: 1024 }, // MB
//     isPopular: { type: Boolean, default: false },
//     trialAvailable: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Plan", planSchema);




const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },

    price: { type: Number, required: true },
    currency: { type: String, default: "USD" },

    durationInDays: { type: Number, required: true },

    features: [{ type: String }],

    maxUploads: { type: Number, default: 0 },
    maxStorage: { type: Number, default: 0 },
    storageUnit: { type: String, default: "MB" },

    allowedProducts: { type: Number, default: 0 },
    allowedMembers: { type: Number, default: 1 },

    discount: {
      percent: { type: Number, default: 0 },
      validTill: { type: Date }
    },

    tags: [{ type: String }],

    isPopular: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    trialAvailable: { type: Boolean, default: false },

    planType: { type: String, default: "yearly" }
  },

  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
