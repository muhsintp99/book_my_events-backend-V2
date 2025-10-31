const express = require("express");
const router = express.Router();
const bannerController = require("../../controllers/admin/bannerController");

// Routes
// IMPORTANT: Specific routes must come before parameterized routes
router.get("/module/:moduleId", bannerController.getBannersByModule);

router.get("/vendor/:vendorId", bannerController.getBannersByVendor);

router.get("/", bannerController.getAllBanners);
router.get("/:id", bannerController.getBannerById);

router.post("/", bannerController.createBanner);
router.put("/:id", bannerController.updateBanner);
router.delete("/:id", bannerController.deleteBanner);
router.patch("/:id/toggle-status", bannerController.toggleBannerStatus);
router.patch("/:id/click", bannerController.incrementBannerClick);

module.exports = router;