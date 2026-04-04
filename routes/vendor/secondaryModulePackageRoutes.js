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
const upload = multer({ storage });

// ROUTES
router.post("/create", upload.single("image"), ctrl.createSecondaryPackage);
router.get("/module/:moduleId/provider/:providerId", ctrl.getPackagesByModuleVendor);
router.put("/:id", upload.single("image"), ctrl.updateSecondaryPackage);
router.delete("/:id", ctrl.deleteSecondaryPackage);

module.exports = router;
