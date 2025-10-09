const express = require("express");
const router = express.Router();
const bannerController = require("../../controllers/admin/bannerController");
const createUpload = require("../../middlewares/upload");

// Multer setup for banners
const upload = createUpload("banners", { fileSizeMB: 10 });

// Routes
router.get("/", bannerController.getAllBanners);
router.get("/:id", bannerController.getBannerById);
router.post("/", upload.single("image"), bannerController.createBanner);
router.put("/:id", upload.single("image"), bannerController.updateBanner);
router.delete("/:id", bannerController.deleteBanner);
router.patch("/:id/toggle-status", bannerController.toggleBannerStatus);
router.patch("/:id/click", bannerController.incrementBannerClick);

module.exports = router;
