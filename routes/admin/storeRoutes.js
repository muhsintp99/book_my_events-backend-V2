import express from 'express';
import createUpload from '../../middlewares/upload.js';
import * as storeController from '../../controllers/admin/storeController.js';

const router = express.Router();

const upload = createUpload('stores', {
  fileSizeMB: 5,
  allowedTypes: ['image/png', 'image/jpeg', 'image/webp']
});

router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStoreById);
router.post('/', upload.single('image'), storeController.createStore);
router.put('/:id', upload.single('image'), storeController.updateStore);
router.delete('/:id', storeController.deleteStore);
router.patch('/:id/toggle-status', storeController.toggleStoreStatus);

export default router;
