const fs = require('fs');
const path = require('path');
const VehicleCategory = require('../../models/admin/vehiclecategoryModel');

// Utility to delete image file
const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted file: ${filePath}`);
    } catch (err) {
      console.error(`Failed to delete file ${filePath}:`, err);
    }
  }
};

// ✅ Create Vehicle Category
exports.createVehicleCategory = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);

    const { 
      title, 
      brands, 
      createdBy, 
      module, 
      description, 
      parentCategory, 
      displayOrder, 
      isActive, 
      isFeatured, 
      metaTitle, 
      metaDescription 
    } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!module || !/^[0-9a-fA-F]{24}$/.test(module)) {
      return res.status(400).json({ error: 'Valid module ID is required' });
    }

    // Prepare vehicle category data
    const vehicleCategoryData = {
      title: title.trim(),
      description: description ? description.trim() : '',
      parentCategory: parentCategory ? parentCategory.trim() : '',
      displayOrder: parseInt(displayOrder) || 0,
      isActive: isActive === 'true',
      isFeatured: isFeatured === 'true',
      metaTitle: metaTitle ? metaTitle.trim() : '',
      metaDescription: metaDescription ? metaDescription.trim() : '',
      brands: brands ? JSON.parse(brands) : [],
      module,
      createdBy: createdBy || null,
      image: req.file ? `/uploads/vehicle-categories/${req.file.filename}` : null
    };

    console.log('Vehicle category data to be created:', vehicleCategoryData);

    const vehicleCategory = await VehicleCategory.create(vehicleCategoryData);

    const populatedVehicleCategory = await VehicleCategory.findById(vehicleCategory._id)
      .populate('brands', '-__v')
      .populate('module', '-__v')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Vehicle category created successfully',
      vehicleCategory: populatedVehicleCategory
    });
  } catch (err) {
    console.error('Error creating vehicle category:', err);
    if (req.file && req.file.path) {
      deleteFileIfExists(req.file.path);
    }
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ✅ Update Vehicle Category
exports.updateVehicleCategory = async (req, res) => {
  try {
    console.log('Update request body:', req.body);
    console.log('Update request file:', req.file);

    const { 
      title, 
      brands, 
      updatedBy, 
      module, 
      description, 
      parentCategory, 
      displayOrder, 
      isActive, 
      isFeatured, 
      metaTitle, 
      metaDescription 
    } = req.body;

    const vehicleCategory = await VehicleCategory.findById(req.params.id);

    if (!vehicleCategory) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle category not found'
      });
    }

    // Handle file upload
    if (req.file) {
      deleteFileIfExists(path.join(__dirname, `../../${vehicleCategory.image}`));
      vehicleCategory.image = `/uploads/vehicle-categories/${req.file.filename}`;
    }

    // Update fields if provided
    if (title) vehicleCategory.title = title.trim();
    if (description) vehicleCategory.description = description.trim();
    if (parentCategory) vehicleCategory.parentCategory = parentCategory.trim();
    if (displayOrder !== undefined) vehicleCategory.displayOrder = parseInt(displayOrder) || 0;
    if (isActive !== undefined) vehicleCategory.isActive = isActive === 'true';
    if (isFeatured !== undefined) vehicleCategory.isFeatured = isFeatured === 'true';
    if (metaTitle) vehicleCategory.metaTitle = metaTitle.trim();
    if (metaDescription) vehicleCategory.metaDescription = metaDescription.trim();
    if (brands) vehicleCategory.brands = JSON.parse(brands);
    if (module) vehicleCategory.module = module;
    if (updatedBy) vehicleCategory.updatedBy = updatedBy;
    vehicleCategory.updatedAt = new Date();

    await vehicleCategory.save();

    const populatedVehicleCategory = await VehicleCategory.findById(vehicleCategory._id)
      .populate('brands', '-__v')
      .populate('module', '-__v')
      .lean();

    res.json({
      success: true,
      message: 'Vehicle category updated successfully',
      vehicleCategory: populatedVehicleCategory
    });
  } catch (err) {
    console.error('Error updating vehicle category:', err);
    if (req.file && req.file.path) {
      deleteFileIfExists(req.file.path);
    }
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Delete Vehicle Category
exports.deleteVehicleCategory = async (req, res) => {
  try {
    const vehicleCategory = await VehicleCategory.findById(req.params.id);

    if (!vehicleCategory) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle category not found'
      });
    }

    deleteFileIfExists(path.join(__dirname, `../../${vehicleCategory.image}`));
    await vehicleCategory.deleteOne();

    res.json({
      success: true,
      message: 'Vehicle category deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting vehicle category:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Get all Vehicle Categories
exports.getVehicleCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = search ? { title: { $regex: search, $options: 'i' } } : {};

    const vehicleCategories = await VehicleCategory.find(query)
      .populate('brands', '-__v')
      .populate('module', '-__v')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await VehicleCategory.countDocuments(query);

    res.json({
      success: true,
      data: vehicleCategories,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching vehicle categories:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Get single Vehicle Category
exports.getVehicleCategory = async (req, res) => {
  try {
    const vehicleCategory = await VehicleCategory.findById(req.params.id)
      .populate('brands', '-__v')
      .populate('module', '-__v')
      .lean();

    if (!vehicleCategory) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle category not found'
      });
    }

    res.json({
      success: true,
      data: vehicleCategory
    });
  } catch (err) {
    console.error('Error fetching vehicle category:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Get all Vehicle Categories by ModuleId
exports.getVehicleCategoriesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    console.log('Fetching vehicle categories for moduleId:', moduleId);

    if (!moduleId || !/^[0-9a-fA-F]{24}$/.test(moduleId)) {
      return res.status(400).json({
        success: false,
        error: 'Valid Module ID is required'
      });
    }

    const vehicleCategories = await VehicleCategory.find({
      module: moduleId,
      isActive: true
    })
      .populate('brands', '-__v')
      .populate('module', '-__v')
      .sort({ createdAt: -1 })
      .lean();

    console.log('Found vehicle categories:', vehicleCategories.length);

    res.json({
      success: true,
      data: vehicleCategories
    });
  } catch (err) {
    console.error('Error fetching vehicle categories by module:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Block Vehicle Category
exports.blockVehicleCategory = async (req, res) => {
  try {
    const vehicleCategory = await VehicleCategory.findById(req.params.id);

    if (!vehicleCategory) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle category not found'
      });
    }

    vehicleCategory.isActive = false;
    vehicleCategory.updatedBy = req.body.updatedBy;
    vehicleCategory.updatedAt = new Date();

    await vehicleCategory.save();

    const populatedVehicleCategory = await VehicleCategory.findById(vehicleCategory._id)
      .populate('brands', '-__v')
      .populate('module', '-__v')
      .lean();

    res.json({
      success: true,
      message: 'Vehicle category blocked successfully',
      vehicleCategory: populatedVehicleCategory
    });
  } catch (err) {
    console.error('Error blocking vehicle category:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// ✅ Reactivate Vehicle Category
exports.reactivateVehicleCategory = async (req, res) => {
  try {
    const vehicleCategory = await VehicleCategory.findById(req.params.id);

    if (!vehicleCategory) {
      return res.status(404).json({
        success: false,
        error: 'Vehicle category not found'
      });
    }

    vehicleCategory.isActive = true;
    vehicleCategory.updatedBy = req.body.updatedBy;
    vehicleCategory.updatedAt = new Date();

    await vehicleCategory.save();

    const populatedVehicleCategory = await VehicleCategory.findById(vehicleCategory._id)
      .populate('brands', '-__v')
      .populate('module', '-__v')
      .lean();

    res.json({
      success: true,
      message: 'Vehicle category reactivated successfully',
      vehicleCategory: populatedVehicleCategory
    });
  } catch (err) {
    console.error('Error reactivating vehicle category:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};