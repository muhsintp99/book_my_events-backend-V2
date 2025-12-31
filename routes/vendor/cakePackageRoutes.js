const express = require("express");
const router = express.Router();

const createUpload = require("../../middlewares/upload");
const cakeController = require("../../controllers/vendor/cakePackageController");
const { protect } = require("../../middlewares/authMiddleware");

// ================= UPLOAD CONFIG =================
const upload = createUpload("cake", {
  fileSizeMB: 10,
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
});

// ================= PUBLIC ROUTES =================

// 🔍 Search cake packages (PUBLIC)
router.get("/search", cakeController.searchCakePackages);

// 🎂 Cakes by provider (PUBLIC)
router.get("/provider/:providerId", cakeController.getCakesByProvider);

// ⭐ Top pick cakes (PUBLIC)
router.get("/top-picks", cakeController.getTopPickCakes);

// ================= VENDOR PROTECTED ROUTES =================

// ➕ Create cake package (VENDOR)
router.post(
  "/",
  protect,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  cakeController.createCakePackage
);

// 📦 Get all cake packages of logged-in vendor
router.get(
  "/",
  protect,
  cakeController.getAllCakePackages
);

// 📄 Get single cake (VENDOR – owns or admin)
router.get(
  "/:id",
  protect,
  cakeController.getCakePackageById
);

// ✏️ Update cake package (VENDOR – owns)
router.put(
  "/:id",
  protect,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  cakeController.updateCakePackage
);

// ❌ Delete cake package (VENDOR – owns)
router.delete(
  "/:id",
  protect,
  cakeController.deleteCakePackage
);

// ================= ADMIN / VENDOR TOGGLES =================

// ⭐ Toggle top pick
router.patch(
  "/:id/toggle-top-pick",
  protect,
  cakeController.toggleTopPickStatus
);

// 🔴 Toggle active / inactive
router.patch(
  "/:id/toggle-active",
  protect,
  cakeController.toggleActiveStatus
);

module.exports = router;
