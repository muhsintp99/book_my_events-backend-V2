const express = require("express");
const router = express.Router();

const boutiqueController = require("../../controllers/vendor/boutiqueController");
const createUpload = require("../../middlewares/upload");

// Create multer instance for boutique
const upload = createUpload("boutique");

// -------- Vendor List --------
router.get("/vendors/:moduleId", boutiqueController.getVendorsForBoutiqueModule);

// -------- Vendor Packages --------
router.get("/provider/:providerId", boutiqueController.getBoutiquePackagesByProvider);

// -------- TopPick & Active --------
router.patch("/:id/toggle-active", boutiqueController.toggleActiveStatus);
router.patch("/:id/toggle-top-pick", boutiqueController.toggleTopPickStatus);

/* =====================================================
   CRUD ROUTES
===================================================== */

// Create boutique package
router.post(
    "/",
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "galleryImages", maxCount: 10 },
        { name: "variationImages", maxCount: 20 },
        { name: "sizeGuideImage", maxCount: 1 },
    ]),
    boutiqueController.createBoutique
);

// Get all boutique packages
router.get("/", boutiqueController.getAllBoutiques);

// Get single boutique package by ID
router.get("/:id", boutiqueController.getBoutiqueById);

// Update boutique package
router.put(
    "/:id",
    upload.fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "galleryImages", maxCount: 10 },
        { name: "variationImages", maxCount: 20 },
        { name: "sizeGuideImage", maxCount: 1 },
    ]),
    boutiqueController.updateBoutique
);

// Delete boutique package
router.delete("/:id", boutiqueController.deleteBoutique);

module.exports = router;
