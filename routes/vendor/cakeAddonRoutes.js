const express = require("express");
const router = express.Router();
const addonController = require("../../controllers/vendor/cakeAddonController");
const createUpload = require("../../middlewares/upload");
const upload = createUpload("cake-addons");

// CRUD for Addons
router.post("/", upload.single("icon"), addonController.createAddon);
router.get("/provider/:providerId", addonController.getAddonsByProvider);
router.put("/:id", upload.single("icon"), addonController.updateAddon);
router.delete("/:id", addonController.deleteAddon);

module.exports = router;
