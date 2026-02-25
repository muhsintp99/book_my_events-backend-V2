const express = require("express");
const router = express.Router();

const controller = require("../../controllers/vendor/mehandiController");
const createUpload = require("../../middlewares/upload");

// =======================================================
// CREATE MULTER INSTANCE FOR MEHANDI FOLDER
// This will store files inside: Uploads/mehandi
// =======================================================
const upload = createUpload("mehandi", {
  fileSizeMB: 5, // max file size 5MB
  allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
});

// =======================================================
// ROUTES
// =======================================================

// ✅ Create Mehandi Package
router.post(
  "/create",
  upload.single("image"),
  controller.createMehandiPackage
);

// ✅ Get All Packages
router.get(
  "/",
  controller.getAllMehandiPackages
);

// ✅ Get Packages by Vendor
router.get(
  "/vendor/:vendorId",
  controller.getMehandiByVendor
);

// ✅ Get Vendors with Package Count
router.get(
  "/vendors/:moduleId",
  controller.getMehandiVendors
);

// ✅ Get Single Package by ID
router.get(
  "/:id",
  controller.getMehandiPackageById
);

// ✅ Update Package
router.put(
  "/:id",
  upload.single("image"),
  controller.updateMehandiPackage
);

// ✅ Delete Package
router.delete(
  "/:id",
  controller.deleteMehandiPackage
);

// ✅ Toggle Active Status
router.patch(
  "/toggle-active/:id",
  controller.toggleActiveStatus
);

// ✅ Toggle Top Pick
router.patch(
  "/toggle-top-pick/:id",
  controller.toggleTopPickStatus
);

module.exports = router;