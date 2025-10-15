const express = require("express");
const router = express.Router();
const vehicleBannerController = require("../../controllers/admin/vehiclebannerController");

// Vendor-specific
router.get("/vendor/:vendorId", vehicleBannerController.getVehicleBannersByVendor);

// CRUD
router.get("/", vehicleBannerController.getAllVehicleBanners);
router.get("/:id", vehicleBannerController.getVehicleBannerById);
router.post("/", vehicleBannerController.createVehicleBanner);
router.put("/:id", vehicleBannerController.updateVehicleBanner);
router.delete("/:id", vehicleBannerController.deleteVehicleBanner);

// Status toggle & click increment
router.patch("/:id/toggle-status", vehicleBannerController.toggleVehicleBannerStatus);
router.patch("/:id/click", vehicleBannerController.incrementVehicleBannerClick);

module.exports = router;
