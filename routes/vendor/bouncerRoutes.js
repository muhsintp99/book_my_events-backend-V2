const express = require("express");
const router = express.Router();

const controller = require("../../controllers/vendor/bouncerController");
const createUpload = require("../../middlewares/upload");

// =======================================================
// CREATE MULTER INSTANCE FOR BOUNCER FOLDER
// This will store files inside: Uploads/bouncer
// =======================================================
const upload = createUpload("bouncer", {
    fileSizeMB: 5, // max file size 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
});

// =======================================================
// ROUTES
// =======================================================

// ✅ Create Bouncer Package
router.post(
    "/create",
    upload.single("image"),
    controller.createBouncerPackage
);

// ✅ Get All Packages
router.get(
    "/",
    controller.getAllBouncerPackages
);

// ✅ Get Packages by Vendor
router.get(
    "/vendor/:vendorId",
    controller.getBouncerByVendor
);

// ✅ Get Vendors with Package Count
router.get(
    "/vendors/:moduleId",
    controller.getBouncerVendors
);

// ✅ Get Single Package by ID
router.get(
    "/:id",
    controller.getBouncerPackageById
);

// ✅ Update Package
router.put(
    "/:id",
    upload.single("image"),
    controller.updateBouncerPackage
);

// ✅ Delete Package
router.delete(
    "/:id",
    controller.deleteBouncerPackage
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
