const mongoose = require("mongoose");

const PortfolioSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    module: {
      type: String,                    // FIXED: Now accepts "MOD-xxx" string IDs
      required: true,
      index: true
    },
    workTitle: { type: String, default: "" },
    description: { type: String, default: "" },

    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
        isFeatured: { type: Boolean, default: false }
      }
    ],

    tags: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

// Enable population even with string _id (optional but helpful)
PortfolioSchema.virtual("moduleInfo", {
  ref: "Module",
  localField: "module",
  foreignField: "_id", // assuming Module uses string _id like "MOD-..."
  justOne: true
});

module.exports = mongoose.model("Portfolio", PortfolioSchema);