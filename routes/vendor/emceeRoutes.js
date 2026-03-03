const express = require("express");
const router = express.Router();

const controller = require("../../controllers/vendor/emceeController");
const createUpload = require("../../middlewares/upload");

// Create Multer instance for emcee folder
const upload = createUpload("emcee", {
    fileSizeMB: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
});

// ✅ Create Emcee Package
router.post(
    "/create",
    upload.single("image"),
    controller.createEmceePackage
);

// ✅ Get All Packages
router.get(
    "/",
    controller.getAllEmceePackages
);

// ✅ Get Packages by Vendor
router.get(
    "/vendor/:vendorId",
    controller.getEmceeByVendor
);

// ✅ Get Vendors with Package Count
router.get(
    "/vendors/:moduleId",
    controller.getEmceeVendors
);

// ✅ Get Single Package by ID
router.get(
    "/:id",
    controller.getEmceePackageById
);

// ✅ Update Package
router.put(
    "/:id",
    upload.single("image"),
    controller.updateEmceePackage
);

// ✅ Delete Package
router.delete(
    "/:id",
    controller.deleteEmceePackage
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
