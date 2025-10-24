// const express = require("express");
// const router = express.Router();
// const zoneController = require("../../controllers/admin/zoneController");



// router.get("/reverse-geocode", zoneController.reverseGeocode);
// router.post("/", zoneController.createZone);
// router.get("/", zoneController.getZones);
// router.get("/:id", zoneController.getZoneById);
// router.put("/:id", zoneController.updateZone);
// router.delete("/:id", zoneController.deleteZone);

// module.exports = router;


const express = require("express");
const router = express.Router();
const zoneController = require("../../controllers/admin/zoneController");
const createUpload = require("../../middlewares/upload"); // add this



// Parse only text fields in form-data
const uploadZone = createUpload('zone-icons');
router.post("/", uploadZone.single('icon'), zoneController.createZone);

// Specific routes MUST come before dynamic /:id routes
router.get("/reverse-geocode", zoneController.reverseGeocode);
router.get("/top", zoneController.getTopZones);

// CRUD operations
router.post("/", zoneController.createZone);
router.get("/", zoneController.getZones);
router.get("/:id", zoneController.getZoneById);
router.put("/:id", zoneController.updateZone);
router.patch("/:id/toggle-top", zoneController.toggleTopZone);
router.delete("/:id", zoneController.deleteZone);

module.exports = router;