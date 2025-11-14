const mongoose = require("mongoose");

const PortfolioSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    workTitle: { type: String, default: "" },
    description: { type: String, default: "" },

    // List of uploaded photos or short videos
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
        isFeatured: { type: Boolean, default: false }
      }
    ],

    // Tags like Bridal, Engagement, HD Makeup, etc.
    tags: [{ type: String }],

    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Portfolio", PortfolioSchema);
