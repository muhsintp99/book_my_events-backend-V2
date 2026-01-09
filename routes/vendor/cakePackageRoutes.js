const express = require("express");
const router = express.Router();

const cakeController = require("../../controllers/vendor/cakePackageController");
const createUpload = require("../../middlewares/upload");

// Create multer instance
const upload = createUpload("cake");

/* =====================================================
   SPECIAL ROUTES (Before dynamic :id routes)
===================================================== */

// Search cakes
router.get("/search", cakeController.searchCakes);

// Get vendors for a module (EXACT SAME AS MAKEUP)
// Example: /api/cakes/vendors/68e5fbc33a5a05dde7500c89
// Example: /api/cakes/vendors/68e5fbc33a5a05dde7500c89?providerId=693c2359d84d171bba553460
router.get("/vendors/:moduleId", cakeController.getVendorsForCakeModule);

// Get cakes by module
router.get("/module/:moduleId", cakeController.getCakesByModule);

// Get cakes by provider
router.get("/provider/:providerId", cakeController.getCakesByProvider);

// Get top pick cakes
router.get("/top-picks", cakeController.getTopPickCakes);

// Toggle top pick status
router.patch("/:id/toggle-top-pick", cakeController.toggleTopPickStatus);

// Toggle active status
router.patch("/:id/toggle-active", cakeController.toggleActiveStatus);

/* =====================================================
   CRUD ROUTES
===================================================== */

// Create cake
router.post(
  "/",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  cakeController.createCake
);

// Get all cakes
router.get("/", cakeController.getAllCakes);

// Get single cake by ID
router.get("/:id", cakeController.getCakeById);

// Update cake
router.put(
  "/:id",
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  cakeController.updateCake
);

// Delete cake
router.delete("/:id", cakeController.deleteCake);

module.exports = router;