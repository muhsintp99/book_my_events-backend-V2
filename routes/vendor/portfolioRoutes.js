const express = require("express");
const router = express.Router();

const createUpload = require("../../middlewares/upload");
const portfolioController = require("../../controllers/vendor/portfolioController");

// ✔ Upload middleware for portfolio (supports multiple images/videos)
const upload = createUpload("portfolio", {
  fileSizeMB: 200, // larger limit for videos
  allowedTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-matroska"
  ]
});

// ------------------------------------------------------
// ⭐ CREATE PORTFOLIO WORK (supports multiple files)
// ------------------------------------------------------
router.post(
  "/",
  upload.array("media", 10),      // IMPORTANT: must match Postman key "media"
  (req, res, next) => {
    console.log("🔥 POST /api/portfolio - Multer received files:", req.files);
    next();
  },
  portfolioController.createPortfolio
);

// ------------------------------------------------------
// ⭐ GET ALL PORTFOLIO WORKS FOR PROVIDER
// ------------------------------------------------------
router.get(
  "/provider/:providerId",
  portfolioController.getPortfolioByProvider
);

// ------------------------------------------------------
// ⭐ GET SINGLE PORTFOLIO ITEM
// ------------------------------------------------------
router.get("/:id", portfolioController.getPortfolioById);

// ------------------------------------------------------
// ⭐ UPDATE PORTFOLIO WORK (replace media or keep old)
// ------------------------------------------------------
router.put(
  "/:id",
  upload.array("media", 10),     // allows uploading multiple files on update
  (req, res, next) => {
    console.log("🔥 PUT /api/portfolio/:id - Multer received files:", req.files);
    next();
  },
  portfolioController.updatePortfolio
);

// ------------------------------------------------------
// ⭐ DELETE PORTFOLIO WORK
// ------------------------------------------------------
router.delete("/:id", portfolioController.deletePortfolio);

// ------------------------------------------------------
// ⭐ TOGGLE FEATURED MEDIA (single media item)
// ------------------------------------------------------
router.patch(
  "/:workId/featured/:mediaIndex",
  portfolioController.toggleFeaturedMedia
);

module.exports = router;
