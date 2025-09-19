const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const bannerController = require('../../controllers/admin/bannerController');

const upload = createUpload('banners', {
  fileSizeMB: 5,
  allowedTypes: ['image/png', 'image/jpeg', 'image/webp']
});

router.get('/', bannerController.getAllBanners);
router.get('/:id', bannerController.getBannerById);
router.post('/', upload.single('image'), bannerController.createBanner);
router.put('/:id', upload.single('image'), bannerController.updateBanner);
router.delete('/:id', bannerController.deleteBanner);
router.patch('/:id/toggle-status', bannerController.toggleBannerStatus);
router.patch('/:id/click', bannerController.incrementBannerClick);

module.exports = router;
