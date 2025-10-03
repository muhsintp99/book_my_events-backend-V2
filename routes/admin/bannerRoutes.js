const express = require("express");
const router = express.Router();
const { upload } = require("../../middlewares/upload");
const bannerController = require("../../controllers/admin/bannerController");

const setBannerFolder = (req, res, next) => {
  req.folder = "banner";
  next();
};

router.get("/", bannerController.getAllBanners);
router.get("/:id", bannerController.getBannerById);
router.post(
  "/",
  setBannerFolder,
  upload.single("image"),
  bannerController.createBanner
);
router.put(
  "/:id",
  setBannerFolder,
  upload.single("image"),
  bannerController.updateBanner
);
router.delete("/:id", bannerController.deleteBanner);
router.patch("/:id/toggle-status", bannerController.toggleBannerStatus);
router.patch("/:id/click", bannerController.incrementBannerClick);

module.exports = router;
