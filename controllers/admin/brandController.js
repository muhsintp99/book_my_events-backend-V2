const fs = require('fs').promises;
const path = require('path');
const Brand = require('../../models/admin/brand');

// Utility to delete file if it exists
const deleteFile = async (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, '../../', filePath);
  try {
    await fs.access(fullPath);
    await fs.unlink(fullPath);
  } catch {
    // Ignore if not exists
  }
};

// ✅ Create
exports.createBrand = async (req, res) => {
  try {
    const iconPath = req.file ? `uploads/brands/${req.file.filename}` : null;

    const brand = await Brand.create({
      title: req.body.title,
      icon: iconPath,
      createdBy: req.body.createdBy
    });

    res.status(201).json(brand);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Update
exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    if (req.file) {
      if (brand.icon) await deleteFile(brand.icon);
      brand.icon = `uploads/brands/${req.file.filename}`;
    }

    if (req.body.title) brand.title = req.body.title;
    brand.updatedBy = req.body.updatedBy;
    brand.updatedAt = new Date();

    await brand.save();
    res.json(brand);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete (hard delete)
exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    if (brand.icon) await deleteFile(brand.icon);
    await brand.deleteOne();

    res.json({ message: 'Brand deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all
exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single
exports.getBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Block (deactivate)
exports.blockBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    brand.isActive = false;
    brand.updatedBy = req.body.updatedBy;
    brand.updatedAt = new Date();

    await brand.save();
    res.json({ message: 'Brand blocked', brand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Reactivate
exports.reactivateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    brand.isActive = true;
    brand.updatedBy = req.body.updatedBy;
    brand.updatedAt = new Date();

    await brand.save();
    res.json({ message: 'Brand reactivated', brand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
