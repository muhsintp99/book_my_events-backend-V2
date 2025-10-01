const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const moduleController = require('../../controllers/admin/moduleController');

const upload = createUpload('modules', {
  fileSizeMB: 2,
  allowedTypes: ['image/png', 'image/jpeg']
});

router.post('/', upload.single('icon'), moduleController.createModule);
router.put('/:id', upload.single('icon'), moduleController.updateModule);
router.delete('/:id', moduleController.deleteModule);
router.get('/', moduleController.getModules);
router.get('/:id', moduleController.getModule);
router.patch('/:id/block', moduleController.blockModule);
router.patch('/:id/reactivate', moduleController.reactivateModule);

module.exports = router;