const express = require("express");
const router = express.Router();

const controller = require("../../controllers/vendor/invitationController");
const createUpload = require("../../middlewares/upload");

// =======================================================
// CREATE MULTER INSTANCE FOR INVITATION FOLDER
// =======================================================
const upload = createUpload("invitation", {
    fileSizeMB: 5, // max file size 5MB
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
});

// Use .fields for multiple fields (thumbnail and images)
const invitationUpload = upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 }
]);

// =======================================================
// ROUTES
// =======================================================

// ✅ Create Invitation Package
router.post(
    "/create",
    invitationUpload,
    controller.createInvitationPackage
);

// ✅ Get All Packages
router.get(
    "/",
    controller.getAllInvitationPackages
);

// ✅ Get Packages by Vendor
router.get(
    "/vendor/:vendorId",
    controller.getInvitationByVendor
);

// ✅ Get Single Package by ID
router.get(
    "/:id",
    controller.getInvitationPackageById
);

// ✅ Update Package
router.put(
    "/:id",
    invitationUpload,
    controller.updateInvitationPackage
);

// ✅ Delete Package
router.delete(
    "/:id",
    controller.deleteInvitationPackage
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
