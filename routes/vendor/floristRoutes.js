const express = require("express");
const router = express.Router();

const controller = require("../../controllers/vendor/floristController");
const createUpload = require("../../middlewares/upload");

// =======================================================
// CREATE MULTER INSTANCE FOR FLORIST FOLDER
// =======================================================
const upload = createUpload("florist", {
    fileSizeMB: 5, // max file size 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
});

// Use .fields for multiple fields (thumbnail and images)
const floristUpload = upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 }
]);

// =======================================================
// ROUTES
// =======================================================

// ✅ Create Florist Package
router.post(
    "/create",
    floristUpload,
    controller.createFloristPackage
);

// ✅ Get All Packages
router.get(
    "/",
    controller.getAllFloristPackages
);

// ✅ Get Packages by Vendor
router.get(
    "/vendor/:vendorId",
    controller.getFloristByVendor
);

// ✅ Get Single Package by ID
router.get(
    "/:id",
    controller.getFloristPackageById
);

// ✅ Update Package
router.put(
    "/:id",
    floristUpload,
    controller.updateFloristPackage
);

// ✅ Delete Package
router.delete(
    "/:id",
    controller.deleteFloristPackage
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
