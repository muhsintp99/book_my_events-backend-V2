const express = require("express");
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const reviewController = require('../../controllers/vendor/reviewController');
const { protect } = require('../../middlewares/authMiddleware');

const upload = createUpload('reviews', {
  fileSizeMB: 5,
  allowedTypes: ['image/png', 'image/jpeg', 'video/mp4']
});

router
  .route('/')
  .post(protect, upload.fields([{ name: 'images' }, { name: 'videos' }]), reviewController.createReview)
  .get(reviewController.getReviewsWithComments);

router.get('/vendor/:vendorId', reviewController.getReviewsByVendor);
router.patch('/:reviewId', protect, reviewController.updateReview);
router.patch('/:reviewId/reply', protect, reviewController.replyToReview);

router.post('/:reviewId/comments', reviewController.addComment);
router.delete('/:reviewId/comments/:commentId', reviewController.deleteComment);

module.exports = router;

