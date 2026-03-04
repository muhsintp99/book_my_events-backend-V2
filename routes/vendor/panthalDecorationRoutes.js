const express = require("express");
const router = express.Router();

const controller = require("../../controllers/vendor/panthalDecorationController");
const createUpload = require("../../middlewares/upload");

// Create Multer instance for panthal-decoration folder
const upload = createUpload("panthal-decoration", {
    fileSizeMB: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
});

// ✅ Create Panthal & Decoration Package
router.post(
    "/create",
    upload.single("image"),
    controller.createPanthalDecorationPackage
);

// ✅ Get All Packages
router.get(
    "/",
    controller.getAllPanthalDecorationPackages
);

// ✅ Get Packages by Vendor
router.get(
    "/vendor/:vendorId",
    controller.getPanthalDecorationByVendor
);

// ✅ Get Vendors with Package Count
router.get(
    "/vendors/:moduleId",
    controller.getPanthalDecorationVendors
);

// ✅ Get Single Package by ID
router.get(
    "/:id",
    controller.getPanthalDecorationPackageById
);

// ✅ Update Package
router.put(
    "/:id",
    upload.single("image"),
    controller.updatePanthalDecorationPackage
);

// ✅ Delete Package
router.delete(
    "/:id",
    controller.deletePanthalDecorationPackage
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
