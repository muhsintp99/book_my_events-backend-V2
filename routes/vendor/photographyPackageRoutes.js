const express = require("express");
const router = express.Router();

const createUpload = require("../../middlewares/upload");
const controller = require("../../controllers/vendor/photographyPackageController");

// Upload middleware
const upload = createUpload("photography", {
  fileSizeMB: 10,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
});

// SPECIAL ROUTES
router.get("/vendors/:moduleId", controller.getVendorsForPhotographyModule);
router.get("/provider/:providerId", controller.getPhotographyByProvider);
router.get("/top-picks", controller.getTopPickPhotographies);
router.patch("/:id/toggle-top-pick", controller.toggleTopPickStatus);
router.patch("/:id/toggle-active", controller.toggleActiveStatus);

// CRUD
router.post(
  "/",
  upload.fields([{ name: "gallery", maxCount: 10 }]),
  controller.createPhotographyPackage
);

router.get("/", controller.getAllPhotographyPackages);
router.get("/:id", controller.getPhotographyPackageById);

router.put(
  "/:id",
  upload.fields([{ name: "gallery", maxCount: 10 }]),
  controller.updatePhotographyPackage
);

router.delete("/:id", controller.deletePhotographyPackage);

module.exports = router;
