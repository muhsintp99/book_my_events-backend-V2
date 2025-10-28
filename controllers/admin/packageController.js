const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Package = require('../../models/admin/Package');
const Venue = require('../../models/vendor/Venue');

// 🧰 Delete file if exists
const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// 🧰 Populate helper
const populatePackage = async (packageId) => {
  return await Package.findById(packageId)
    .populate('module', '-__v')
    .populate('categories', '-__v');
};

// ✅ Create Package
exports.createPackage = async (req, res) => {
  try {
    const {
      module,
      categories,
      title,
      subtitle,
      description,
      packageType,
      includes,
      price,
      createdBy,
      packageId,
      providerId, // ✅ NEW FIELD
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Package title is required' });
    }

    if (price === undefined || isNaN(price)) {
      return res.status(400).json({ error: 'Valid price is required' });
    }

    // ✅ Validate providerId
    if (!providerId) {
      return res.status(400).json({ error: 'Provider ID is required' });
    }

    // Validate or generate Package ID
    let finalPackageId = packageId;
    if (packageId) {
      const existing = await Package.findOne({ packageId });
      if (existing) {
        return res.status(400).json({ error: `Package with ID ${packageId} already exists` });
      }
    } else {
      finalPackageId = `PKG-${uuidv4()}`;
    }

    // ✅ Parse includes
    let parsedIncludes = [];
    if (includes) {
      try {
        parsedIncludes = JSON.parse(includes);
      } catch {
        parsedIncludes = includes;
      }
    }

    // ✅ Parse categories
    let parsedCategories = [];
    if (categories) {
      try {
        parsedCategories = JSON.parse(categories);
      } catch {
        parsedCategories = [categories];
      }
    }

    // ✅ Handle multiple images
    const images = req.files?.images
      ? req.files.images.map((file) => `uploads/packages/${file.filename}`)
      : [];

    // ✅ Handle thumbnail
    const thumbnail = req.files?.thumbnail
      ? `uploads/packages/${req.files.thumbnail[0].filename}`
      : null;

    // ✅ Create Package Data
    const packageData = {
      packageId: finalPackageId,
      module: module || null,
      categories: parsedCategories,
      title: title.trim(),
      subtitle: subtitle || '',
      description: description || '',
      packageType: packageType || 'basic',
      includes: parsedIncludes,
      price: parseFloat(price),
      images,
      thumbnail,
      createdBy: createdBy || null,
      provider: providerId, // ✅ Added here
    };

    const newPackage = await Package.create(packageData);
    const populated = await populatePackage(newPackage._id);

    res.status(201).json({
      message: 'Package created successfully',
      package: populated,
    });
  } catch (err) {
    console.error('Create Package Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Package
exports.updatePackage = async (req, res) => {
  try {
    const {
      module,
      categories,
      title,
      subtitle,
      description,
      packageType,
      includes,
      price,
      updatedBy,
      packageId,
    } = req.body;

    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    if (packageId && packageId !== pkg.packageId) {
      const existing = await Package.findOne({ packageId });
      if (existing) {
        return res.status(400).json({ error: `Package with ID ${packageId} already exists` });
      }
      pkg.packageId = packageId;
    }

    // ✅ Update multiple images
    if (req.files?.images) {
      if (pkg.images && pkg.images.length) {
        pkg.images.forEach((imgPath) => deleteFileIfExists(path.join(__dirname, `../../${imgPath}`)));
      }
      pkg.images = req.files.images.map((file) => `uploads/packages/${file.filename}`);
    }

    // ✅ Update thumbnail
    if (req.files?.thumbnail) {
      deleteFileIfExists(path.join(__dirname, `../../${pkg.thumbnail}`));
      pkg.thumbnail = `uploads/packages/${req.files.thumbnail[0].filename}`;
    }

    // ✅ Parse categories
    if (categories) {
      try {
        pkg.categories = JSON.parse(categories);
      } catch {
        pkg.categories = [categories];
      }
    }

    // ✅ Parse includes
    if (includes) {
      try {
        pkg.includes = JSON.parse(includes);
      } catch {
        pkg.includes = includes;
      }
    }

    if (module) pkg.module = module;
    if (title) pkg.title = title.trim();
    if (subtitle) pkg.subtitle = subtitle;
    if (description) pkg.description = description;
    if (packageType) pkg.packageType = packageType;
    if (price !== undefined && !isNaN(price)) pkg.price = parseFloat(price);
    if (updatedBy) pkg.updatedBy = updatedBy;

    await pkg.save();
    const populated = await populatePackage(pkg._id);

    res.json({ message: 'Package updated successfully', package: populated });
  } catch (err) {
    console.error('Update Package Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Package
exports.deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    if (pkg.images && pkg.images.length) {
      pkg.images.forEach((imgPath) => deleteFileIfExists(path.join(__dirname, `../../${imgPath}`)));
    }

    deleteFileIfExists(path.join(__dirname, `../../${pkg.thumbnail}`));

    await pkg.deleteOne();
    res.json({ message: 'Package deleted successfully' });
  } catch (err) {
    console.error('Delete Package Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get All Packages
exports.getPackages = async (req, res) => {
  try {
    const packages = await Package.find()
      .populate('module', '-__v')
      .populate('categories', '-__v');
    res.json(packages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Packages by Provider ID
// ✅ Get Packages by Provider ID
exports.getPackagesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!providerId) {
      return res.status(400).json({ error: 'Provider ID is required' });
    }

    // ✅ FIXED: Query by 'provider' instead of 'createdBy'
    let packages = await Package.find({ 
      $or: [
        { provider: providerId },
        { createdBy: providerId }
      ]
    })
      .populate('module', 'title images isActive')
      .populate('categories', 'title')
      .sort({ createdAt: -1 });

    if (!packages.length) {
      const venues = await Venue.find({
        $or: [{ provider: providerId }, { createdBy: providerId }]
      }).populate({
        path: 'packages',
        populate: [
          { path: 'module', select: 'title images isActive' },
          { path: 'categories', select: 'title' }
        ]
      });

      const packageMap = new Map();
      venues.forEach(venue => {
        if (venue.packages) {
          venue.packages.forEach(pkg => {
            if (pkg && pkg._id) packageMap.set(pkg._id.toString(), pkg);
          });
        }
      });

      packages = Array.from(packageMap.values());
    }

    if (!packages.length) {
      return res.status(404).json({ message: 'No packages found for this provider', providerId });
    }

    res.json({
      message: 'Packages fetched successfully',
      count: packages.length,
      packages
    });
  } catch (err) {
    console.error('Get Packages by Provider Error:', err);
    res.status(500).json({ error: err.message });
  }
};
// ✅ Get Single Package
exports.getPackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id)
      .populate('module', '-__v')
      .populate('categories', '-__v');
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Packages by Module ID
exports.getPackagesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    if (!moduleId)
      return res.status(400).json({ error: 'Module ID is required' });

    const packages = await Package.find({ module: moduleId })
      .populate('module', 'title images isActive')
      .populate('categories', 'title')
      .sort({ createdAt: -1 });

    if (!packages.length)
      return res.status(404).json({ message: 'No packages found for this module' });

    res.json({ message: 'Packages fetched successfully', packages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Block / Reactivate
exports.blockPackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.body.updatedBy || null },
      { new: true }
    );
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json({ message: 'Package blocked successfully', package: pkg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reactivatePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedBy: req.body.updatedBy || null },
      { new: true }
    );
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json({ message: 'Package reactivated successfully', package: pkg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
