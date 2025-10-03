const express = require("express");
const router = express.Router();
const { upload } = require("../../middlewares/upload");
const brandController = require("../../controllers/admin/brandController");

const setBrandFolder = (req, res, next) => {
  req.folder = "brand";
  next();
};

// CRUD Routes
router.post(
  "/",
  setBrandFolder,
  upload.single("icon"),
  brandController.createBrand
);
router.put(
  "/:id",
  setBrandFolder,
  upload.single("icon"),
  brandController.updateBrand
);
router.delete("/:id", brandController.deleteBrand);
router.get("/", brandController.getBrands);
router.get("/:id", brandController.getBrand);

// ✅ Filter brands by Module
router.get("/module/:moduleId", brandController.getBrandsByModule);

router.patch("/:id/block", brandController.blockBrand);
router.patch("/:id/reactivate", brandController.reactivateBrand);

module.exports = router;
