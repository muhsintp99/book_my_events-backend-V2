const express = require("express");
const router = express.Router();

const ornamentController = require("../../controllers/vendor/ornamentPackageController");
const createUpload = require("../../middlewares/upload");

// Create multer instance
const upload = createUpload("ornaments");

// -------- Vendor List --------
router.get("/vendors/:moduleId", ornamentController.getVendorsForOrnamentModule);

// -------- Vendor Packages --------
router.get("/provider/:providerId", ornamentController.getOrnamentPackagesByProvider);

// -------- TopPick & Active --------
router.patch("/:id/toggle-active", ornamentController.toggleActiveStatus);
router.patch("/:id/toggle-top-pick", ornamentController.toggleTopPickStatus);

/* =====================================================
   CRUD ROUTES
===================================================== */

// Create ornament
router.post(
    "/",
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "galleryImages", maxCount: 10 },
    ]),
    ornamentController.createOrnament
);

// Get all ornaments
router.get("/", ornamentController.getAllOrnaments);

// Get single ornament by ID
router.get("/:id", ornamentController.getOrnamentById);

// Update ornament
router.put(
    "/:id",
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "galleryImages", maxCount: 10 },
    ]),
    ornamentController.updateOrnament
);

// Delete ornament
router.delete("/:id", ornamentController.deleteOrnament);

module.exports = router;
