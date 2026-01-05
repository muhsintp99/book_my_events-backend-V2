const express = require("express");
const router = express.Router();

const cakeController = require("../../controllers/vendor/cakePackageController");
const createUpload = require("../../middlewares/upload");

// ✅ create multer instance (SAME AS VEHICLE)
const upload = createUpload("cake");

/* ================= CAKE ROUTES ================= */

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

// Get cakes by provider
router.get("/provider/:providerId", cakeController.getCakesByProvider);

// Get single cake
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
