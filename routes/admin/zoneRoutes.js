const express = require("express");
const router = express.Router();
const zoneController = require("../../controllers/admin/zoneController");

router.post("/", zoneController.createZone);
router.get("/", zoneController.getZones);
router.get("/:id", zoneController.getZoneById);
router.put("/:id", zoneController.updateZone);
router.delete("/:id", zoneController.deleteZone);

module.exports = router;