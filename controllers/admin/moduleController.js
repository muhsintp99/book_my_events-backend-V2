

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Added UUID for unique moduleId
const Module = require('../../models/admin/module');

// Helper: delete file if exists
const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper: populate module -> categories -> brands
const populateModule = async (moduleId) => {
  return await Module.findById(moduleId)
    .populate({
      path: 'categories',
      select: '-__v',
      populate: {
        path: 'brands',
        select: '-__v'
      }
    });
};

// Create Module
exports.createModule = async (req, res) => {
  try {
    const { title, categories, createdBy, moduleId } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Module title is required' });
    }

    // Validate provided moduleId or generate a new one
    let finalModuleId = moduleId;
    if (moduleId) {
      const existingModule = await Module.findOne({ moduleId });
      if (existingModule) {
        return res.status(400).json({ error: `Module with moduleId ${moduleId} already exists` });
      }
    } else {
      finalModuleId = `MOD-${uuidv4()}`; // Generate unique moduleId
    }

    const moduleData = {
      moduleId: finalModuleId,
      title: title.trim(),
      categories: categories ? JSON.parse(categories) : [],
      icon: req.file ? `uploads/modules/${req.file.filename}` : null,
      createdBy: createdBy || null,
    };

    const module = await Module.create(moduleData);
    const populated = await populateModule(module._id);
    res.status(201).json({ message: 'Module created', module: populated });
  } catch (err) {
    console.error('Create Module Error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: `Duplicate moduleId: ${err.keyValue.moduleId}` });
    }
    res.status(500).json({ error: err.message });
  }
};

// Update Module
exports.updateModule = async (req, res) => {
  try {
    const { title, categories, updatedBy, moduleId } = req.body;
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ error: 'Module not found' });

    // Validate moduleId if provided and different
    if (moduleId && moduleId !== module.moduleId) {
      const existingModule = await Module.findOne({ moduleId });
      if (existingModule) {
        return res.status(400).json({ error: `Module with moduleId ${moduleId} already exists` });
      }
      module.moduleId = moduleId;
    }

    if (req.file) {
      deleteFileIfExists(path.join(__dirname, `../../${module.icon}`));
      module.icon = `uploads/modules/${req.file.filename}`;
    }

    if (title) module.title = title.trim();
    if (categories) module.categories = JSON.parse(categories);
    if (updatedBy) module.updatedBy = updatedBy;

    await module.save();
    const populated = await populateModule(module._id);
    res.json({ message: 'Module updated', module: populated });
  } catch (err) {
    console.error('Update Module Error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: `Duplicate moduleId: ${err.keyValue.moduleId}` });
    }
    res.status(500).json({ error: err.message });
  }
};

// Delete Module
exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) return res.status(404).json({ error: 'Module not found' });

    deleteFileIfExists(path.join(__dirname, `../../${module.icon}`));
    await module.deleteOne();
    res.json({ message: 'Module deleted successfully' });
  } catch (err) {
    console.error('Delete Module Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get all modules (fully populated)
exports.getModules = async (req, res) => {
  try {
    const modules = await Module.find()
      .populate({
        path: 'categories',
        select: '-__v',
        populate: { path: 'brands', select: '-__v' }
      });
    res.json(modules);
  } catch (err) {
    console.error('Get Modules Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Get single module (fully populated)
exports.getModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate({
        path: 'categories',
        select: '-__v',
        populate: { path: 'brands', select: '-__v' }
      });
    if (!module) return res.status(404).json({ error: 'Module not found' });
    res.json(module);
  } catch (err) {
    console.error('Get Module Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Block Module
exports.blockModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.body.updatedBy || null },
      { new: true }
    ).populate({
      path: 'categories',
      select: '-__v',
      populate: { path: 'brands', select: '-__v' }
    });

    if (!module) return res.status(404).json({ error: 'Module not found' });
    res.json({ message: 'Module blocked', module });
  } catch (err) {
    console.error('Block Module Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Reactivate Module
exports.reactivateModule = async (req, res) => {
  try {
    const module = await Module.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedBy: req.body.updatedBy || null },
      { new: true }
    ).populate({
      path: 'categories',
      select: '-__v',
      populate: { path: 'brands', select: '-__v' }
    });

    if (!module) return res.status(404).json({ error: 'Module not found' });
    res.json({ message: 'Module reactivated', module });
  } catch (err) {
    console.error('Reactivate Module Error:', err);
    res.status(500).json({ error: err.message });
  }
};