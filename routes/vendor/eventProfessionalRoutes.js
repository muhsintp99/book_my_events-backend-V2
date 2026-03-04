const express = require("express");
const router = express.Router();

const controller = require("../../controllers/vendor/eventProfessionalController");
const createUpload = require("../../middlewares/upload");

// Create Multer instance for event-professional folder
const upload = createUpload("event-professional", {
    fileSizeMB: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
});

// ✅ Create Event Professional Package
router.post(
    "/create",
    upload.single("image"),
    controller.createEventProfessionalPackage
);

// ✅ Get All Packages
router.get(
    "/",
    controller.getAllEventProfessionalPackages
);

// ✅ Get Packages by Vendor
router.get(
    "/vendor/:vendorId",
    controller.getEventProfessionalByVendor
);

// ✅ Get Vendors with Package Count
router.get(
    "/vendors/:moduleId",
    controller.getEventProfessionalVendors
);

// ✅ Get Single Package by ID
router.get(
    "/:id",
    controller.getEventProfessionalPackageById
);

// ✅ Update Package
router.put(
    "/:id",
    upload.single("image"),
    controller.updateEventProfessionalPackage
);

// ✅ Delete Package
router.delete(
    "/:id",
    controller.deleteEventProfessionalPackage
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
