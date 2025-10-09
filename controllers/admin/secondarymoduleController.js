
const fs = require('fs');
const path = require('path');
const SecondaryModule = require('../../models/admin/secondarymodule'); // model

// Delete file helper
const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Helper: populate secondary module -> categories -> brands
const populateSecondaryModule = async (moduleId) => {
  return await SecondaryModule.findById(moduleId)
    .populate({
      path: 'categories',
      select: '-__v',
      populate: {
        path: 'brands',
        select: '-__v'
      }
    });
};

// ✅ Create Secondary Module (no title restriction)
exports.createSecondaryModule = async (req, res) => {
  try {
    const { title, categories, createdBy } = req.body;

    const moduleData = {
      title,
      categories: categories ? JSON.parse(categories) : [],
      icon: req.files?.icon?.[0] ? `uploads/secondaryModules/${req.files.icon[0].filename}` : null,
      createdBy
    };

    const module = await SecondaryModule.create(moduleData);
    const populated = await populateSecondaryModule(module._id);
    res.status(201).json({ message: 'Secondary Module created', module: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Secondary Module
exports.updateSecondaryModule = async (req, res) => {
  try {
    const { title, categories, updatedBy } = req.body;
    const module = await SecondaryModule.findById(req.params.id);
    if (!module) return res.status(404).json({ error: 'Module not found' });

    if (req.files?.icon?.[0]) {
      deleteFileIfExists(path.join(__dirname, `../../${module.icon}`));
      module.icon = `uploads/secondaryModules/${req.files.icon[0].filename}`;
    }

    if (title) module.title = title;
    if (categories) module.categories = JSON.parse(categories);
    if (updatedBy) module.updatedBy = updatedBy;

    await module.save();
    const populated = await populateSecondaryModule(module._id);
    res.json({ message: 'Secondary Module updated', module: populated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Secondary Module
exports.deleteSecondaryModule = async (req, res) => {
  try {
    const module = await SecondaryModule.findById(req.params.id);
    if (!module) return res.status(404).json({ error: 'Module not found' });

    deleteFileIfExists(path.join(__dirname, `../../${module.icon}`));
    await module.deleteOne();
    res.json({ message: 'Secondary Module deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all Secondary Modules
exports.getSecondaryModules = async (req, res) => {
  try {
    const modules = await SecondaryModule.find()
      .populate({
        path: 'categories',
        select: '-__v',
        populate: { path: 'brands', select: '-__v' }
      });
    res.json(modules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single Secondary Module
exports.getSecondaryModule = async (req, res) => {
  try {
    const module = await SecondaryModule.findById(req.params.id)
      .populate({
        path: 'categories',
        select: '-__v',
        populate: { path: 'brands', select: '-__v' }
      });
    if (!module) return res.status(404).json({ error: 'Module not found' });
    res.json(module);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Block Secondary Module
exports.blockSecondaryModule = async (req, res) => {
  try {
    const module = await SecondaryModule.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.body.updatedBy },
      { new: true }
    ).populate({
      path: 'categories',
      select: '-__v',
      populate: { path: 'brands', select: '-__v' }
    });

    if (!module) return res.status(404).json({ error: 'Module not found' });
    res.json({ message: 'Secondary Module blocked', module });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Reactivate Secondary Module
exports.reactivateSecondaryModule = async (req, res) => {
  try {
    const module = await SecondaryModule.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedBy: req.body.updatedBy },
      { new: true }
    ).populate({
      path: 'categories',
      select: '-__v',
      populate: { path: 'brands', select: '-__v' }
    });

    if (!module) return res.status(404).json({ error: 'Module not found' });
    res.json({ message: 'Secondary Module reactivated', module });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
