const mongoose = require("mongoose");

const reviewCommentSchema = new mongoose.Schema(
  {
    review: { type: mongoose.Schema.Types.ObjectId, ref: "Review", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    text: { type: String, required: true, trim: true },

    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "ReviewComment" }, // for nested replies
  },
  { timestamps: true }
);

module.exports = mongoose.model("ReviewComment", reviewCommentSchema);
