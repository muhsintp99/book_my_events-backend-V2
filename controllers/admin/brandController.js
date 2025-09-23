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
    // Ignore if file doesn't exist
  }
};

// ✅ Create Brand
exports.createBrand = async (req, res) => {
  try {
    const iconPath = req.file ? `uploads/brands/${req.file.filename}` : null;

    const brand = await Brand.create({
      title: req.body.title,
      icon: iconPath,
      module: req.body.module, // ✅ lowercase module
      createdBy: req.body.createdBy
    });

    const populatedBrand = await Brand.findById(brand._id).populate('module', '-__v');

    res.status(201).json({ message: 'Brand created', brand: populatedBrand });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Update Brand
exports.updateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    if (req.file) {
      if (brand.icon) await deleteFile(brand.icon);
      brand.icon = `uploads/brands/${req.file.filename}`;
    }

    if (req.body.title) brand.title = req.body.title;
    if (req.body.module) brand.module = req.body.module; // ✅ lowercase
    brand.updatedBy = req.body.updatedBy;
    brand.updatedAt = new Date();

    await brand.save();

    const populatedBrand = await Brand.findById(brand._id).populate('module', '-__v');

    res.json({ message: 'Brand updated', brand: populatedBrand });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ✅ Delete Brand
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

// ✅ Get all Brands
exports.getBrands = async (req, res) => {
  try {
    const brands = await Brand.find().populate('module', '-__v');
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single Brand
exports.getBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).populate('module', '-__v');
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Brands by Module
exports.getBrandsByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const brands = await Brand.find({ module: moduleId }).populate('module', '-__v');
    res.json(brands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// ✅ Block Brand
exports.blockBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    brand.isActive = false;
    brand.updatedBy = req.body.updatedBy;
    brand.updatedAt = new Date();

    await brand.save();

    const populatedBrand = await Brand.findById(brand._id).populate('module', '-__v');

    res.json({ message: 'Brand blocked', brand: populatedBrand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Reactivate Brand
exports.reactivateBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ error: 'Brand not found' });

    brand.isActive = true;
    brand.updatedBy = req.body.updatedBy;
    brand.updatedAt = new Date();

    await brand.save();

    const populatedBrand = await Brand.findById(brand._id).populate('module', '-__v');

    res.json({ message: 'Brand reactivated', brand: populatedBrand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
