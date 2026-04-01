const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/galleryController');
const createUpload = require("../../middlewares/upload");

const upload = createUpload("gallery", {
    fileSizeMB: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
});

router.get('/', controller.getGallery);
router.post('/create', upload.single("image"), controller.createGallery);
router.put('/:id', upload.single("image"), controller.updateGallery);
router.delete('/:id', controller.deleteGallery);

module.exports = router;
