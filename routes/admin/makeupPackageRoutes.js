const express = require("express");
const router = express.Router();

const createUpload = require("../../middlewares/upload");
const makeupController = require("../../controllers/admin/makeupPackageController");

// Upload middleware
const upload = createUpload("makeup", {
  fileSizeMB: 10,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
});

// ---------------------- SPECIAL ROUTES ----------------------
router.get("/vendors/:moduleId", makeupController.getVendorsForMakeupModule);
router.get("/provider/:providerId", makeupController.getMakeupByProvider);
router.get("/top-picks", makeupController.getTopPickMakeups);
router.patch("/:id/toggle-top-pick", makeupController.toggleTopPickStatus);
router.patch("/:id/toggle-active", makeupController.toggleActiveStatus);

// ---------------------- CRUD ROUTES ----------------------
router.post(
  "/",
  upload.fields([{ name: "gallery", maxCount: 10 }]),
  makeupController.createMakeupPackage
);

router.get("/", makeupController.getAllMakeupPackages);

router.get("/:id", makeupController.getMakeupPackageById);

router.put(
  "/:id",
  upload.fields([{ name: "gallery", maxCount: 10 }]),
  makeupController.updateMakeupPackage
);

router.delete("/:id", makeupController.deleteMakeupPackage);

module.exports = router;
