const fs = require('fs').promises;
const path = require('path');
const BrandPlatform = require('../../models/admin/brandPlatformModel');

/* =====================================================
   DELETE FILE UTILITY
===================================================== */
const deleteFile = async (filePath) => {
  if (!filePath) return;

  const fullPath = path.join(__dirname, '../../', filePath);

  try {
    await fs.access(fullPath);
    await fs.unlink(fullPath);
  } catch {
    // ignore if not exists
  }
};

/* =====================================================
   CREATE
   If showFirst true → move to index 1
===================================================== */
exports.createBrandPlatform = async (req, res) => {
  try {
    const iconPath = req.file
      ? `uploads/brand-platform/${req.file.filename}`
      : null;

    const isFirst =
      req.body.showFirst === "true" || req.body.showFirst === true;

    // remove old first
    if (isFirst) {
      await BrandPlatform.updateMany(
        { moduleId: req.body.moduleId },
        { showFirst: false }
      );
    }

    const item = await BrandPlatform.create({
      moduleId: req.body.moduleId,
      title: req.body.title,
      url: req.body.url,
      showFirst: isFirst,
      icon: iconPath,
      createdBy: req.body.createdBy
    });

    const populated = await BrandPlatform.findById(item._id)
      .populate('moduleId', '-__v');

    res.status(201).json({
      message: 'Brand platform created',
      data: populated
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* =====================================================
   UPDATE
===================================================== */
exports.updateBrandPlatform = async (req, res) => {
  try {
    const item = await BrandPlatform.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    // new icon
    if (req.file) {
      if (item.icon) await deleteFile(item.icon);

      item.icon = `uploads/brand-platform/${req.file.filename}`;
    }

    if (req.body.title) item.title = req.body.title;
    if (req.body.url) item.url = req.body.url;
    if (req.body.moduleId) item.moduleId = req.body.moduleId;

    const isFirst =
      req.body.showFirst === "true" || req.body.showFirst === true;

    if (isFirst) {
      await BrandPlatform.updateMany(
        { moduleId: item.moduleId },
        { showFirst: false }
      );
      item.showFirst = true;
    }

    item.updatedBy = req.body.updatedBy;
    item.updatedAt = new Date();

    await item.save();

    const populated = await BrandPlatform.findById(item._id)
      .populate('moduleId', '-__v');

    res.json({
      message: 'Updated',
      data: populated
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* =====================================================
   DELETE
===================================================== */
exports.deleteBrandPlatform = async (req, res) => {
  try {
    const item = await BrandPlatform.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    if (item.icon) await deleteFile(item.icon);

    await item.deleteOne();

    res.json({ message: 'Deleted successfully' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =====================================================
   GET ALL
===================================================== */
exports.getAll = async (req, res) => {
  try {
    const data = await BrandPlatform.find()
      .populate('moduleId', '-__v')
      .sort({ showFirst: -1, createdAt: 1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =====================================================
   GET SINGLE
===================================================== */
exports.getOne = async (req, res) => {
  try {
    const item = await BrandPlatform.findById(req.params.id)
      .populate('moduleId', '-__v');

    if (!item) return res.status(404).json({ error: 'Not found' });

    res.json(item);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =====================================================
   GET BY MODULE (FIRST INDEX SORT)
===================================================== */
exports.getByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const data = await BrandPlatform.find({ moduleId })
      .populate('moduleId', '-__v')
      .sort({ showFirst: -1, createdAt: 1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =====================================================
   BLOCK
===================================================== */
exports.block = async (req, res) => {
  try {
    const item = await BrandPlatform.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    item.isActive = false;
    item.updatedBy = req.body.updatedBy;
    item.updatedAt = new Date();

    await item.save();

    res.json({ message: 'Blocked', data: item });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =====================================================
   REACTIVATE
===================================================== */
exports.reactivate = async (req, res) => {
  try {
    const item = await BrandPlatform.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    item.isActive = true;
    item.updatedBy = req.body.updatedBy;
    item.updatedAt = new Date();

    await item.save();

    res.json({ message: 'Reactivated', data: item });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
