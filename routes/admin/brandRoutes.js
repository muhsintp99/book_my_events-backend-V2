const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const brandController = require('../../controllers/admin/brandController');

const upload = createUpload('brands', {
  fileSizeMB: 2,
  allowedTypes: ['image/png', 'image/jpeg']
});

router.post('/', upload.single('icon'), brandController.createBrand);
router.put('/:id', upload.single('icon'), brandController.updateBrand);
router.delete('/:id', brandController.deleteBrand);
router.get('/', brandController.getBrands);
router.get('/:id', brandController.getBrand);
router.patch('/:id/block', brandController.blockBrand);
router.patch('/:id/reactivate', brandController.reactivateBrand);

module.exports = router;
