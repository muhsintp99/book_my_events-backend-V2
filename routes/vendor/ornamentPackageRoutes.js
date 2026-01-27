const express = require("express");
const router = express.Router();

const ornamentController = require("../../controllers/vendor/ornamentPackageController");
const createUpload = require("../../middlewares/upload");

// Create multer instance
const upload = createUpload("ornaments");

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
// Get ornaments by provider
router.get("/provider/:providerId", ornamentController.getOrnamentsByProvider);

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
