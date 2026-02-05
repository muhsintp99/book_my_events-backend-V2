const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const controller = require('../../controllers/admin/brandPlatformController');

const upload = createUpload('brand-platform', {
  fileSizeMB: 2,
  allowedTypes: ['image/png', 'image/jpeg', 'image/webp']
});

/* CRUD */
router.post('/', upload.single('icon'), controller.createBrandPlatform);
router.put('/:id', upload.single('icon'), controller.updateBrandPlatform);
router.delete('/:id', controller.deleteBrandPlatform);
router.get('/', controller.getAll);
router.get('/:id', controller.getOne);

/* BY MODULE */
router.get('/module/:moduleId', controller.getByModule);

/* BLOCK */
router.patch('/:id/block', controller.block);

/* REACTIVATE */
router.patch('/:id/reactivate', controller.reactivate);

module.exports = router;
