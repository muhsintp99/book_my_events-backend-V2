const express = require('express');
const router = express.Router();
const createUpload = require('../../middlewares/upload');
const secondaryModuleController = require('../../controllers/admin/secondarymoduleController');

// Create upload middleware that can handle multiple fields
const upload = createUpload('secondaryModules', {
  fileSizeMB: 2,
  allowedTypes: ['image/png', 'image/jpeg']
});

// Create Secondary Module - handle both icon and thumbnail
router.post('/', upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), secondaryModuleController.createSecondaryModule);

// Update Secondary Module - handle both icon and thumbnail
router.put('/:id', upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]), secondaryModuleController.updateSecondaryModule);

// Delete Secondary Module
router.delete('/:id', secondaryModuleController.deleteSecondaryModule);

// Get all Secondary Modules
router.get('/', secondaryModuleController.getSecondaryModules);

// Get single Secondary Module
router.get('/:id', secondaryModuleController.getSecondaryModule);

// Block Secondary Module
router.patch('/:id/block', secondaryModuleController.blockSecondaryModule);

// Reactivate Secondary Module
router.patch('/:id/reactivate', secondaryModuleController.reactivateSecondaryModule);

module.exports = router;