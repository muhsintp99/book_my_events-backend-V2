const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Package = require('../../models/admin/Package');
const Module = require('../../models/admin/module');

// 🧰 Helper: Delete file if exists
const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// 🧰 Helper: Populate package → module & categories
const populatePackage = async (packageId) => {
  return await Package.findById(packageId)
    .populate('module', '-__v')
    .populate('categories', '-__v');
};

// ✅ Create Single Package (Original functionality)
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
      priceRange,
      createdBy,
      packageId,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Package title is required' });
    }

    // Validate provided packageId or generate new one
    let finalPackageId = packageId;
    if (packageId) {
      const existing = await Package.findOne({ packageId });
      if (existing) {
        return res
          .status(400)
          .json({ error: `Package with ID ${packageId} already exists` });
      }
    } else {
      finalPackageId = `PKG-${uuidv4()}`;
    }

    // Parse includes & price
    const parsedIncludes = includes ? JSON.parse(includes) : [];
    const parsedPrice = priceRange ? JSON.parse(priceRange) : { min: 0, max: 0 };

    // ✅ Parse categories (stringified JSON or array)
    let parsedCategories = [];
    if (categories) {
      if (Array.isArray(categories)) {
        parsedCategories = categories;
      } else {
        try {
          parsedCategories = JSON.parse(categories);
        } catch {
          parsedCategories = [categories];
        }
      }
    }

    const packageData = {
      packageId: finalPackageId,
      module: module || null,
      categories: parsedCategories,
      title: title.trim(),
      subtitle: subtitle || '',
      description: description || '',
      packageType: packageType || 'basic',
      includes: parsedIncludes,
      priceRange: parsedPrice,
      images: req.files?.images
        ? `uploads/packages/${req.files.images[0].filename}`
        : null,
      thumbnail: req.files?.thumbnail
        ? `uploads/packages/${req.files.thumbnail[0].filename}`
        : null,
      createdBy: createdBy || null,
    };

    const newPackage = await Package.create(packageData);
    const populated = await populatePackage(newPackage._id);

    res.status(201).json({
      message: 'Package created successfully',
      package: populated,
    });
  } catch (err) {
    console.error('Create Package Error:', err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ error: `Duplicate packageId: ${err.keyValue.packageId}` });
    }
    res.status(500).json({ error: err.message });
  }
};

// ✅ NEW: Bulk Create Packages
exports.createBulkPackages = async (req, res) => {
  try {
    const { packages } = req.body;

    // Validate input
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return res.status(400).json({ 
        error: 'Request body must contain a "packages" array with at least one package' 
      });
    }

    const results = {
      success: [],
      failed: [],
      total: packages.length
    };

    // Process each package
    for (let i = 0; i < packages.length; i++) {
      const packageInput = packages[i];
      
      try {
        // Validate title
        if (!packageInput.title || !packageInput.title.trim()) {
          results.failed.push({
            index: i,
            data: packageInput,
            error: 'Package title is required'
          });
          continue;
        }

        // Generate or validate packageId
        let finalPackageId = packageInput.packageId;
        if (finalPackageId) {
          const existing = await Package.findOne({ packageId: finalPackageId });
          if (existing) {
            results.failed.push({
              index: i,
              data: packageInput,
              error: `Package with ID ${finalPackageId} already exists`
            });
            continue;
          }
        } else {
          finalPackageId = `PKG-${uuidv4()}`;
        }

        // Parse includes & price
        const parsedIncludes = typeof packageInput.includes === 'string' 
          ? JSON.parse(packageInput.includes) 
          : (packageInput.includes || []);
        const parsedPrice = typeof packageInput.priceRange === 'string' 
          ? JSON.parse(packageInput.priceRange) 
          : (packageInput.priceRange || { min: 0, max: 0 });

        // Parse categories
        let parsedCategories = [];
        if (packageInput.categories) {
          if (Array.isArray(packageInput.categories)) {
            parsedCategories = packageInput.categories;
          } else {
            try {
              parsedCategories = JSON.parse(packageInput.categories);
            } catch {
              parsedCategories = [packageInput.categories];
            }
          }
        }

        // Prepare package data
        const packageData = {
          packageId: finalPackageId,
          module: packageInput.module || null,
          categories: parsedCategories,
          title: packageInput.title.trim(),
          subtitle: packageInput.subtitle || '',
          description: packageInput.description || '',
          packageType: packageInput.packageType || 'basic',
          includes: parsedIncludes,
          priceRange: parsedPrice,
          images: packageInput.images || null,
          thumbnail: packageInput.thumbnail || null,
          createdBy: packageInput.createdBy || null,
        };

        // Create package
        const newPackage = await Package.create(packageData);
        const populated = await populatePackage(newPackage._id);

        results.success.push({
          index: i,
          packageId: newPackage.packageId,
          _id: newPackage._id,
          package: populated
        });

      } catch (err) {
        console.error(`Error creating package at index ${i}:`, err);
        results.failed.push({
          index: i,
          data: packageInput,
          error: err.message
        });
      }
    }

    // Determine response status
    const statusCode = results.failed.length === 0 ? 201 : 
                      results.success.length === 0 ? 400 : 207; // 207 = Multi-Status

    res.status(statusCode).json({
      message: `Bulk package creation completed. Success: ${results.success.length}, Failed: ${results.failed.length}`,
      results: {
        total: results.total,
        successCount: results.success.length,
        failedCount: results.failed.length,
        createdPackages: results.success,
        failedPackages: results.failed
      }
    });

  } catch (err) {
    console.error('Bulk Create Packages Error:', err);
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
      priceRange,
      updatedBy,
      packageId,
    } = req.body;

    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    // Validate packageId if provided and different
    if (packageId && packageId !== pkg.packageId) {
      const existing = await Package.findOne({ packageId });
      if (existing) {
        return res
          .status(400)
          .json({ error: `Package with ID ${packageId} already exists` });
      }
      pkg.packageId = packageId;
    }

    // ✅ Handle file updates (images + thumbnail)
    if (req.files?.images) {
      deleteFileIfExists(path.join(__dirname, `../../${pkg.images}`));
      pkg.images = `uploads/packages/${req.files.images[0].filename}`;
    }

    if (req.files?.thumbnail) {
      deleteFileIfExists(path.join(__dirname, `../../${pkg.thumbnail}`));
      pkg.thumbnail = `uploads/packages/${req.files.thumbnail[0].filename}`;
    }

    // ✅ Parse & update categories
    if (categories) {
      if (Array.isArray(categories)) {
        pkg.categories = categories;
      } else {
        try {
          pkg.categories = JSON.parse(categories);
        } catch {
          pkg.categories = [categories];
        }
      }
    }

    // Update fields
    if (module) pkg.module = module;
    if (title) pkg.title = title.trim();
    if (subtitle) pkg.subtitle = subtitle;
    if (description) pkg.description = description;
    if (packageType) pkg.packageType = packageType;
    if (includes) pkg.includes = JSON.parse(includes);
    if (priceRange) pkg.priceRange = JSON.parse(priceRange);
    if (updatedBy) pkg.updatedBy = updatedBy;

    await pkg.save();
    const populated = await populatePackage(pkg._id);

    res.json({ message: 'Package updated successfully', package: populated });
  } catch (err) {
    console.error('Update Package Error:', err);
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ error: `Duplicate packageId: ${err.keyValue.packageId}` });
    }
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Package
exports.deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    deleteFileIfExists(path.join(__dirname, `../../${pkg.images}`));
    deleteFileIfExists(path.join(__dirname, `../../${pkg.thumbnail}`));

    await pkg.deleteOne();
    res.json({ message: 'Package deleted successfully' });
  } catch (err) {
    console.error('Delete Package Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all Packages
exports.getPackages = async (req, res) => {
  try {
    const packages = await Package.find()
      .populate('module', '-__v')
      .populate('categories', '-__v');
    res.json(packages);
  } catch (err) {
    console.error('Get Packages Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single Package
exports.getPackage = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id)
      .populate('module', '-__v')
      .populate('categories', '-__v');

    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(pkg);
  } catch (err) {
    console.error('Get Package Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Packages by Module ID
exports.getPackagesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    if (!moduleId) return res.status(400).json({ error: 'Module ID is required' });

    const packages = await Package.find({ module: moduleId })
      .populate('module', 'title images isActive')
      .populate('categories', 'title')
      .sort({ createdAt: -1 });

    if (!packages || packages.length === 0) {
      return res.status(404).json({ message: 'No packages found for this module' });
    }

    res.json({ message: 'Packages fetched successfully', packages });
  } catch (err) {
    console.error('Get Packages by Module Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Block Package
exports.blockPackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.body.updatedBy || null },
      { new: true }
    )
      .populate('module', '-__v')
      .populate('categories', '-__v');

    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json({ message: 'Package blocked successfully', package: pkg });
  } catch (err) {
    console.error('Block Package Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Reactivate Package
exports.reactivatePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(
      req.params.id,
      { isActive: true, updatedBy: req.body.updatedBy || null },
      { new: true }
    )
      .populate('module', '-__v')
      .populate('categories', '-__v');

    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json({ message: 'Package reactivated successfully', package: pkg });
  } catch (err) {
    console.error('Reactivate Package Error:', err);
    res.status(500).json({ error: err.message });
  }
};
