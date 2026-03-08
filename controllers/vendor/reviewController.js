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

exports.getReviewsByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const reviews = await Review.find({ vendorId })
      .populate("user", "firstName lastName email profilePhoto")
      .sort({ createdAt: -1 })
      .lean();

    for (const review of reviews) {
      review.comments = await ReviewComment.find({ review: review._id })
        .populate("user", "firstName lastName email profilePhoto")
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

exports.replyToReview = async (req, res) => {
  try {
    const { replyText } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      {
        replyFromOwner: replyText,
        repliedAt: new Date(),
      },
      { new: true }
    );

    if (!review) return res.status(404).json({ message: "Review not found" });

    res.status(200).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Find the review first to check ownership
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Check if the user is the owner of the review
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this review" });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    await review.save();

    res.status(200).json({ success: true, data: review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
