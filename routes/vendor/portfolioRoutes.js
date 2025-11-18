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

// CREATE
router.post(
  "/",
  upload.array("media", 10),
  portfolioController.createPortfolio
);

// ⭐ SEPARATE ROUTE → GET PORTFOLIO BY MODULE
router.get(
  "/module/:moduleId",
  portfolioController.getPortfolioByModule
);

// ⭐ GET PORTFOLIO BY PROVIDER
router.get(
  "/provider/:providerId",
  portfolioController.getPortfolioByProvider
);

// OPTIONAL: GET BY PROVIDER + MODULE
// router.get(
//   "/provider/:providerId/module/:moduleId",
//   portfolioController.getPortfolioByProviderAndModule
// );

// GET ONE
router.get("/:id", portfolioController.getPortfolioById);

// UPDATE
router.put(
  "/:id",
  upload.array("media", 10),
  portfolioController.updatePortfolio
);

// DELETE
router.delete("/:id", portfolioController.deletePortfolio);

// FEATURED MEDIA
router.patch(
  "/:workId/featured/:mediaIndex",
  portfolioController.toggleFeaturedMedia
);

module.exports = router;
