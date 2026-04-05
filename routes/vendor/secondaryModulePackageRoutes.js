const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/vendor/secondaryModulePackageController");
const multer = require("multer");
const path = require("path");

// MULTER SETUP
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "Uploads/packages/"),
    filename: (req, file, cb) => cb(null, `PKG-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

/* =====================================================
   STATIC ROUTES - MUST COME FIRST
===================================================== */

// Full Search & Discovery
router.get("/", ctrl.getAllSecondaryPackages);
router.get("/vendors/:moduleId", ctrl.getSecondaryVendors);
router.get("/vendor/:vendorId", ctrl.getPackagesByVendor);

/* =====================================================
   CREATE / UPDATE / DELETE / TOGGLE
===================================================== */

// Create
router.post("/create", upload.single("image"), ctrl.createSecondaryPackage);

// Toggle Statuses
router.patch("/toggle-active/:id", ctrl.toggleSecondaryActiveStatus);
router.patch("/toggle-top-pick/:id", ctrl.toggleSecondaryTopPickStatus);

// Update/Delete Ops
router.put("/:id", upload.single("image"), ctrl.updateSecondaryPackage);
router.delete("/:id", ctrl.deleteSecondaryPackage);

// Single Details (Must be last)
router.get("/:id", ctrl.getSecondaryPackageById);

module.exports = router;
