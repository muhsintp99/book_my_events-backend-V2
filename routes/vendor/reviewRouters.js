const express = require("express");
const router = express.Router();
const { upload } = require("../../middlewares/upload");
const reviewController = require("../../controllers/vendor/reviewController");

const setReviewFolder = (req, res, next) => {
  req.folder = "review";
  next();
};

router
  .route("/")
  .post(
    setReviewFolder,
    upload.fields([{ name: "images" }, { name: "videos" }]),
    reviewController.createReview
  )
  .get(reviewController.getReviewsWithComments);

router.post("/:reviewId/comments", reviewController.addComment);
router.delete("/:reviewId/comments/:commentId", reviewController.deleteComment);

module.exports = router;
