const express = require("express");
const router = express.Router();
const makeupTypeController = require("../../controllers/admin/makeupTypeController");

// CRUD
router.post("/", makeupTypeController.createMakeupType);
router.get("/", makeupTypeController.getMakeupTypes);
router.put("/:id", makeupTypeController.updateMakeupType);
router.delete("/:id", makeupTypeController.deleteMakeupType);

module.exports = router;
