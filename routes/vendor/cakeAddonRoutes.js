const express = require("express");
const router = express.Router();
const addonController = require("../../controllers/vendor/cakeAddonController");
const createUpload = require("../../middlewares/upload");
const upload = createUpload("cake-addons");

// CRUD for Addons
router.post("/", upload.single("image"), addonController.createAddon);
router.get("/provider/:providerId", addonController.getAddonsByProvider);
router.put("/:id", upload.single("image"), addonController.updateAddon);
router.delete("/:id", addonController.deleteAddon);

// CRUD for Templates
router.post("/templates", addonController.createTemplate);
router.get("/templates/provider/:providerId", addonController.getTemplatesByProvider);
router.put("/templates/:id", addonController.updateTemplate);
router.delete("/templates/:id", addonController.deleteTemplate);

module.exports = router;
