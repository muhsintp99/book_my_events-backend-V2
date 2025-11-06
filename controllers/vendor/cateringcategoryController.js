const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Catering = require('../../models/vendor/Catering');
const Venue = require('../../models/vendor/Venue');

// 🧹 Helper: Delete file if exists
const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// 🧩 Helper: Populate catering data
const populateCatering = async (cateringId) => {
  return await Catering.findById(cateringId)
    .populate('module', '-__v')
    .populate('categories', '-__v');
};

// ✅ Create Catering
exports.createCatering = async (req, res) => {
  try {
    const {
      module,
      categories,
      title,
      subtitle,
      description,
      cateringType,
      includes,
      price,
      createdBy,
      cateringId,
      providerId,
    } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: 'Catering title is required' });
    if (!providerId) return res.status(400).json({ error: 'Provider ID is required' });
    if (price === undefined || isNaN(price)) return res.status(400).json({ error: 'Valid price is required' });

    // Ensure unique catering ID
    let finalCateringId = cateringId || `CAT-${uuidv4()}`;
    if (cateringId && await Catering.findOne({ cateringId })) {
      return res.status(400).json({ error: `Catering with ID ${cateringId} already exists` });
    }

    // Parse includes (either JSON or array)
    let parsedIncludes = [];
    if (includes) {
      try {
        parsedIncludes = typeof includes === 'string' ? JSON.parse(includes) : includes;
      } catch {
        parsedIncludes = [];
      }
    }

    // Parse categories
    let parsedCategories = [];
    if (categories) {
      try {
        parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories;
      } catch {
        parsedCategories = [];
      }
    }

    // ✅ FIX: Handle uploaded files with correct path (capital U to match server.js)
    const images = req.files?.images
      ? req.files.images.map((file) => `Uploads/catering/${file.filename}`)
      : [];

    const thumbnail = req.files?.thumbnail
      ? `Uploads/catering/${req.files.thumbnail[0].filename}`
      : null;

    const cateringData = {
      cateringId: finalCateringId,
      module: module || null,
      categories: parsedCategories,
      title: title.trim(),
      subtitle: subtitle || '',
      description: description || '',
      cateringType: cateringType || 'basic',
      includes: parsedIncludes,
      price: parseFloat(price),
      images,
      thumbnail,
      createdBy: createdBy || null,
      provider: providerId,
    };

    const newCatering = await Catering.create(cateringData);
    const populated = await populateCatering(newCatering._id);

    res.status(201).json({
      message: 'Catering created successfully',
      catering: populated,
    });
  } catch (err) {
    console.error('❌ Create Catering Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Catering
exports.updateCatering = async (req, res) => {
  try {
    const catering = await Catering.findById(req.params.id);
    if (!catering) return res.status(404).json({ error: 'Catering not found' });

    const {
      module,
      categories,
      title,
      subtitle,
      description,
      cateringType,
      includes,
      price,
      updatedBy,
      cateringId,
    } = req.body;

    // Unique catering ID validation
    if (cateringId && cateringId !== catering.cateringId) {
      if (await Catering.findOne({ cateringId })) {
        return res.status(400).json({ error: `Catering with ID ${cateringId} already exists` });
      }
      catering.cateringId = cateringId;
    }

    // ✅ FIX: Handle new images with correct path
    if (req.files?.images) {
      catering.images.forEach((imgPath) => deleteFileIfExists(path.join(__dirname, `../../${imgPath}`)));
      catering.images = req.files.images.map((file) => `Uploads/catering/${file.filename}`);
    }

    // ✅ FIX: Handle new thumbnail with correct path
    if (req.files?.thumbnail) {
      deleteFileIfExists(path.join(__dirname, `../../${catering.thumbnail}`));
      catering.thumbnail = `Uploads/catering/${req.files.thumbnail[0].filename}`;
    }

    // Parse categories & includes
    if (categories) {
      try {
        catering.categories = typeof categories === 'string' ? JSON.parse(categories) : categories;
      } catch {
        catering.categories = [];
      }
    }

    if (includes) {
      try {
        catering.includes = typeof includes === 'string' ? JSON.parse(includes) : includes;
      } catch {
        catering.includes = [];
      }
    }

    // Update other fields
    if (module) catering.module = module;
    if (title) catering.title = title.trim();
    if (subtitle) catering.subtitle = subtitle;
    if (description) catering.description = description;
    if (cateringType) catering.cateringType = cateringType;
    if (price !== undefined && !isNaN(price)) catering.price = parseFloat(price);
    if (updatedBy) catering.updatedBy = updatedBy;

    await catering.save();
    const populated = await populateCatering(catering._id);

    res.json({ message: 'Catering updated successfully', catering: populated });
  } catch (err) {
    console.error('❌ Update Catering Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Catering
exports.deleteCatering = async (req, res) => {
  try {
    const catering = await Catering.findById(req.params.id);
    if (!catering) return res.status(404).json({ error: 'Catering not found' });

    catering.images.forEach((imgPath) => deleteFileIfExists(path.join(__dirname, `../../${imgPath}`)));
    deleteFileIfExists(path.join(__dirname, `../../${catering.thumbnail}`));

    await catering.deleteOne();
    res.json({ message: 'Catering deleted successfully' });
  } catch (err) {
    console.error('❌ Delete Catering Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get All Caterings
exports.getCaterings = async (req, res) => {
  try {
    const caterings = await Catering.find()
      .populate('module', '-__v')
      .populate('categories', '-__v');
    res.json(caterings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Caterings by Provider
exports.getCateringsByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    if (!providerId) return res.status(400).json({ error: 'Provider ID is required' });

    let caterings = await Catering.find({
      $or: [{ provider: providerId }, { createdBy: providerId }]
    })
      .populate('module', 'title images isActive')
      .populate('categories', 'title')
      .sort({ createdAt: -1 });

    if (!caterings.length) {
      const venues = await Venue.find({
        $or: [{ provider: providerId }, { createdBy: providerId }]
      }).populate({
        path: 'caterings',
        populate: [
          { path: 'module', select: 'title images isActive' },
          { path: 'categories', select: 'title' }
        ]
      });

      const cateringMap = new Map();
      venues.forEach(v => v.caterings?.forEach(cat => {
        if (cat && cat._id) cateringMap.set(cat._id.toString(), cat);
      }));

      caterings = Array.from(cateringMap.values());
    }

    if (!caterings.length) {
      return res.status(404).json({ message: 'No caterings found for this provider' });
    }

    res.json({ message: 'Caterings fetched successfully', count: caterings.length, caterings });
  } catch (err) {
    console.error('❌ Get Caterings by Provider Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Single Catering
exports.getCatering = async (req, res) => {
  try {
    const catering = await Catering.findById(req.params.id)
      .populate('module', '-__v')
      .populate('categories', '-__v');
    if (!catering) return res.status(404).json({ error: 'Catering not found' });
    res.json(catering);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Caterings by Module
exports.getCateringsByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    if (!moduleId) return res.status(400).json({ error: 'Module ID is required' });

    const caterings = await Catering.find({ module: moduleId })
      .populate('module', 'title images isActive')
      .populate('categories', 'title')
      .sort({ createdAt: -1 });

    if (!caterings.length)
      return res.status(404).json({ message: 'No caterings found for this module' });

    res.json({ message: 'Caterings fetched successfully', caterings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Block / Reactivate
exports.blockCatering = async (req, res) => {
  try {
    const catering = await Catering.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.body.updatedBy || null },
      { new: true }
    );
    if (!catering) return res.status(404).json({ error: 'Catering not found' });
    res.json({ message: 'Catering blocked successfully', catering });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reactivateCatering = async (req, res) => {
  try {
    const catering = await Catering.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedBy: req.body.updatedBy || null },
      { new: true }
    );
    if (!catering) return res.status(404).json({ error: 'Catering not found' });
    res.json({ message: 'Catering reactivated successfully', catering });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};