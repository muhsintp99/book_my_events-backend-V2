const express = require("express");
const router = express.Router();

const controller = require("../../controllers/vendor/lightAndSoundPackageController");
const createUpload = require("../../middlewares/upload");

// =======================================================
// CREATE MULTER INSTANCE FOR LIGHT AND SOUND FOLDER
// =======================================================
const upload = createUpload("light-sound", {
    fileSizeMB: 10, // max file size 10MB
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
});

// Use .fields for multiple fields (thumbnail and images)
const lightAndSoundUpload = upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 15 }
]);

// =======================================================
// ROUTES - ORDERED BY SPECIFICITY (Most specific first)
// =======================================================

// ✅ Create Light and Sound Package
router.post(
    "/create",
    lightAndSoundUpload,
    controller.createLightAndSoundPackage
);

// ✅ Toggle Active Status (must come before /:id)
router.patch(
    "/toggle-active/:id",
    controller.toggleActiveStatus
);

// ✅ Toggle Top Pick (must come before /:id)
router.patch(
    "/toggle-top-pick/:id",
    controller.toggleTopPickStatus
);

// ✅ Get Vendors with Package Count (must come before /:id)
router.get(
    "/vendors/:moduleId",
    controller.getLightAndSoundVendors
);

// ✅ Get Packages by Vendor (must come before /:id)
router.get(
    "/vendor/:vendorId",
    controller.getLightAndSoundByVendor
);

// ✅ Get All Packages
router.get(
    "/",
    controller.getAllLightAndSoundPackages
);

// ✅ Get Single Package by ID
router.get(
    "/:id",
    controller.getLightAndSoundPackageById
);

// ✅ Update Package
router.put(
    "/:id",
    lightAndSoundUpload,
    controller.updateLightAndSoundPackage
);

// ✅ Delete Package
router.delete(
    "/:id",
    controller.deleteLightAndSoundPackage
);

module.exports = router;
