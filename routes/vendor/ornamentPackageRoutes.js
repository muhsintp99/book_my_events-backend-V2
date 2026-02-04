const express = require("express");
const router = express.Router();

const ornamentController = require("../../controllers/vendor/ornamentPackageController");
const createUpload = require("../../middlewares/upload");

// Create multer instance
const upload = createUpload("ornaments");

// -------- Vendor List --------
router.get("/vendors-list", ornamentController.getOrnamentVendors);
router.get("/vendors/:moduleId", ornamentController.getVendorsForOrnamentModule);

// -------- Collections --------
router.get("/collections/list", ornamentController.getCollections);

// -------- Categories --------
router.get("/categories/list", ornamentController.getCategories);

// -------- Occasions --------
router.get("/occasions/list", ornamentController.getOccasions);

// -------- Vendor Packages --------
router.get("/provider/:providerId", ornamentController.getOrnamentPackagesByProvider);

// -------- TopPick & Active --------
router.patch("/:id/toggle-active", ornamentController.toggleActiveStatus);
router.patch("/:id/toggle-top-pick", ornamentController.toggleTopPickStatus);

// -------- Bulk Collections Migration --------
router.post("/migrate/bulk-collections", ornamentController.bulkAddCollections);
router.patch("/:id/add-collection", ornamentController.addCollectionToOrnament);

// -------- Migration --------
router.post("/migrate-split", ornamentController.migrateAllToSeparate);

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

// -------- Rental & Purchase Dedicated Routes --------
router.get("/rental", (req, res, next) => {
    req.query.availabilityMode = "rental";
    next();
}, ornamentController.getAllOrnaments);

router.get("/purchase", (req, res, next) => {
    req.query.availabilityMode = "purchase";
    next();
}, ornamentController.getAllOrnaments);

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
