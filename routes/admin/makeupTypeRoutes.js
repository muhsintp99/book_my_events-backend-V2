// routes/admin/makeupTypeRoutes.js
const express = require("express");
const router = express.Router();

const makeupTypeController = require("../../controllers/admin/makeupTypeController");

// ❌ Removed upload middleware
router.post("/", makeupTypeController.createMakeupType);
router.get("/", makeupTypeController.getMakeupTypes);
router.put("/:id", makeupTypeController.updateMakeupType);
router.delete("/:id", makeupTypeController.deleteMakeupType);

module.exports = router;
