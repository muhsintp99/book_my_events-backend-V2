const express = require("express");
const router = express.Router();
const makeupTypeController = require("../../controllers/admin/makeupTypeController");
const createUpload = require("../../middlewares/upload");

const upload = createUpload("makeupTypes");

router.post("/", upload.single("image"), makeupTypeController.createMakeupType);
router.get("/", makeupTypeController.getMakeupTypes);
router.put("/:id", upload.single("image"), makeupTypeController.updateMakeupType);
router.delete("/:id", makeupTypeController.deleteMakeupType);

module.exports = router;
