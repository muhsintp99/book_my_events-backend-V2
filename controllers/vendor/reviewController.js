const Review = require("../../models/vendor/Review");
const ReviewComment = require("../../models/vendor/ReviewComment");

exports.createReview = async (req, res) => {
  try {
    const data = req.body;
    data.user = req.user._id;

    const review = await Review.create(data);
    res.status(201).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getReviewsWithComments = async (req, res) => {
  try {
    const { targetType, targetId } = req.query;
    const reviews = await Review.find({ targetType, targetId })
      .populate("user", "firstName lastName email")
      .lean();

    for (const review of reviews) {
      review.comments = await ReviewComment.find({ review: review._id })
        .populate("user", "firstName lastName email")
        .lean();
    }

    res.status(200).json({ success: true, data: reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add Comment under Review
exports.addComment = async (req, res) => {
  try {
    const { text, parentComment } = req.body;

    const comment = await ReviewComment.create({
      review: req.params.reviewId,
      user: req.user._id,
      text,
      parentComment: parentComment || null,
    });

    // Increment review comment count
    await Review.findByIdAndUpdate(req.params.reviewId, {
      $inc: { reviewCount: 1 },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await ReviewComment.findByIdAndDelete(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    await Review.findByIdAndUpdate(comment.review, {
      $inc: { reviewCount: -1 },
    });

    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
