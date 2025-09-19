const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, 
    targetType: {
      type: String,
      required: true,
      enum: ["Venue", "Vehicle", "Product", "Service"],
    },

    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },

    comment: { type: String, trim: true },

    images: [String],
    videos: [String],

    replyFromOwner: { type: String, trim: true },
    repliedAt: Date,

    isVerifiedBooking: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },

    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },

    reviewCount: { type: Number, default: 0 }, // count of child comments
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
