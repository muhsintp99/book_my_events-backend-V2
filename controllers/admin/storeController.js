const fs = require('fs');
const path = require('path');
const Store = require('../../models/admin/store.js');

const __dirname = path.resolve();

/**
 * @desc Create new store
 */
const createStore = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const image = req.file ? `/uploads/stores/${req.file.filename}` : null;

    const store = new Store({ name, description, status, image });
    await store.save();

    res.status(201).json({ message: 'Store created successfully', store });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create store', error: error.message });
  }
};

/**
 * @desc Get all stores
 */
const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find();
    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stores', error: error.message });
  }
};

/**
 * @desc Get single store by ID
 */
const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });
    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch store', error: error.message });
  }
};

/**
 * @desc Update store
 */
const updateStore = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });

    // If new image is uploaded, remove old one
    if (req.file) {
      if (store.image) {
        const oldPath = path.join(__dirname, store.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      store.image = `/uploads/stores/${req.file.filename}`;
    }

    store.name = name ?? store.name;
    store.description = description ?? store.description;
    store.status = status ?? store.status;

    await store.save();
    res.status(200).json({ message: 'Store updated successfully', store });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update store', error: error.message });
  }
};

/**
 * @desc Delete store
 */
const deleteStore = async (req, res) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });

    // Delete image from folder
    if (store.image) {
      const imagePath = path.join(__dirname, store.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    res.status(200).json({ message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete store', error: error.message });
  }
};

/**
 * @desc Toggle active/inactive status
 */
const toggleStoreStatus = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: 'Store not found' });

    store.status = store.status === 'active' ? 'inactive' : 'active';
    await store.save();

    res.status(200).json({ message: 'Store status updated', status: store.status });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

module.exports = {
  createStore,
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
  toggleStoreStatus
};
