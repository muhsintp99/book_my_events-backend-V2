const express = require("express");
const router = express.Router();

const createUpload = require("../../middlewares/upload");
const portfolioController = require("../../controllers/vendor/portfolioController");

const upload = createUpload("portfolio", {
  fileSizeMB: 200,
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

// ===============================
// CREATE PORTFOLIO
// ===============================
router.post(
  "/",
  upload.fields([
    { name: "thumbnail", maxCount: 1 }, // ✅ REQUIRED
    { name: "images", maxCount: 20 },   // gallery images
    { name: "videos", maxCount: 10 } ,
      { name: "videoThumbnail", maxCount: 1 }    // ✅ NEW
   // videos
  ]),
  portfolioController.createPortfolio
);

// ===============================
// GET ALL
// ===============================
router.get("/", portfolioController.getAllPortfolio);

// ===============================
// GET BY MODULE
// ===============================
router.get("/module/:moduleId", portfolioController.getPortfolioByModule);


// ===============================
// GET BY PROVIDER
// ===============================
router.get("/provider/:providerId", portfolioController.getPortfolioByProvider);

// ===============================
// GET ONE
// ===============================
router.get("/:id", portfolioController.getPortfolioById);

// ===============================
// UPDATE
// ===============================
router.put(
  "/:id",
  upload.fields([
        { name: "thumbnail", maxCount: 1 }, // ✅ REQUIRED
    { name: "images", maxCount: 20 },
    { name: "videos", maxCount: 10 }
  ]),
  portfolioController.updatePortfolio
);

// ===============================
// DELETE
// ===============================
router.delete("/:id", portfolioController.deletePortfolio);

// ===============================
// FEATURED MEDIA
// ===============================
router.patch(
  "/:workId/featured/:mediaIndex",
  portfolioController.toggleFeaturedMedia
);

module.exports = router;
