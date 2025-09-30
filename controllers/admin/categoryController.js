// const fs = require('fs');
// const path = require('path');
// const Category = require('../../models/admin/category');
// const Brand = require('../../models/admin/brand');

// // Utility to delete image file
// const deleteFileIfExists = (filePath) => {
//   if (filePath && fs.existsSync(filePath)) {
//     fs.unlinkSync(filePath);
//   }
// };

// // Create Category
// exports.createCategory = async (req, res) => {
//   try {
//     const { title, brands, createdBy } = req.body;

//     const categoryData = {
//       title,
//       brands: brands ? JSON.parse(brands) : [],
//       createdBy,
//       image: req.file ? `uploads/categories/${req.file.filename}` : null
//     };

//     const category = await Category.create(categoryData);

//     // Populate brands
//     const populatedCategory = await Category.findById(category._id)
//       .populate('brands', '-__v');

//     res.status(201).json({ message: 'Category created', category: populatedCategory });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // Update Category
// exports.updateCategory = async (req, res) => {
//   try {
//     const { title, brands, updatedBy } = req.body;
//     const category = await Category.findById(req.params.id);
//     if (!category) return res.status(404).json({ error: 'Category not found' });

//     if (req.file) {
//       deleteFileIfExists(path.join(__dirname, `../../${category.image}`));
//       category.image = `uploads/categories/${req.file.filename}`;
//     }

//     if (title) category.title = title;
//     if (brands) category.brands = JSON.parse(brands);
//     if (updatedBy) category.updatedBy = updatedBy;

//     await category.save();

//     const populatedCategory = await Category.findById(category._id)
//       .populate('brands', '-__v');

//     res.json({ message: 'Category updated', category: populatedCategory });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // Delete Category
// exports.deleteCategory = async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id);
//     if (!category) return res.status(404).json({ error: 'Category not found' });

//     deleteFileIfExists(path.join(__dirname, `../../${category.image}`));
//     await category.deleteOne();

//     res.json({ message: 'Category deleted successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // Get all Categories (populate brands)
// exports.getCategories = async (req, res) => {
//   try {
//     const categories = await Category.find()
//       .populate('brands', '-__v');

//     res.json(categories);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // Get single Category (populate brands)
// exports.getCategory = async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id)
//       .populate('brands', '-__v');

//     if (!category) return res.status(404).json({ error: 'Category not found' });
//     res.json(category);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // Block Category
// exports.blockCategory = async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id);
//     if (!category) return res.status(404).json({ error: 'Category not found' });

//     category.isActive = false;
//     category.updatedBy = req.body.updatedBy;
//     category.updatedAt = new Date();

//     await category.save();

//     const populatedCategory = await Category.findById(category._id)
//       .populate('brands', '-__v');

//     res.json({ message: 'Category blocked', category: populatedCategory });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // Reactivate Category
// exports.reactivateCategory = async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id);
//     if (!category) return res.status(404).json({ error: 'Category not found' });

//     category.isActive = true;
//     category.updatedBy = req.body.updatedBy;
//     category.updatedAt = new Date();

//     await category.save();

//     const populatedCategory = await Category.findById(category._id)
//       .populate('brands', '-__v');

//     res.json({ message: 'Category reactivated', category: populatedCategory });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// };


//new
const fs = require('fs');
const path = require('path');
const Category = require('../../models/admin/category');
const Brand = require('../../models/admin/brand');

// Utility to delete image file
const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// ✅ Create Category (with single Module) - FIXED
exports.createCategory = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug log
    console.log('Request file:', req.file); // Debug log
    
    const { title, brands, createdBy, module } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!module) {
      return res.status(400).json({ error: 'Module is required' });
    }

    const categoryData = {
      title: title.trim(),
      brands: brands ? JSON.parse(brands) : [],
      module, // single module reference
      createdBy: createdBy || null,
      image: req.file ? `uploads/categories/${req.file.filename}` : null
    };

    console.log('Category data to be created:', categoryData); // Debug log

    const category = await Category.create(categoryData);

    const populatedCategory = await Category.findById(category._id)
      .populate('brands', '-__v')
      .populate('module', '-__v');

    res.status(201).json({ 
      success: true,
      message: 'Category created successfully', 
      category: populatedCategory 
    });
  } catch (err) {
    console.error('Error creating category:', err);
    res.status(500).json({ 
      success: false,
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ✅ Update Category (handle single Module)
exports.updateCategory = async (req, res) => {
  try {
    console.log('Update request body:', req.body); // Debug log
    
    const { title, brands, updatedBy, module } = req.body;
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }

    // Handle file upload
    if (req.file) {
      deleteFileIfExists(path.join(__dirname, `../../${category.image}`));
      category.image = `uploads/categories/${req.file.filename}`;
    }

    // Update fields if provided
    if (title) category.title = title.trim();
    if (brands) category.brands = JSON.parse(brands);
    if (module) category.module = module;
    if (updatedBy) category.updatedBy = updatedBy;
    category.updatedAt = new Date();

    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('brands', '-__v')
      .populate('module', '-__v');

    res.json({ 
      success: true,
      message: 'Category updated successfully', 
      category: populatedCategory 
    });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// ✅ Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }

    deleteFileIfExists(path.join(__dirname, `../../${category.image}`));
    await category.deleteOne();

    res.json({ 
      success: true,
      message: 'Category deleted successfully' 
    });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// ✅ Get all Categories (populate brands + module)
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('brands', '-__v')
      .populate('module', '-__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// ✅ Get single Category (populate brands + module)
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('brands', '-__v')
      .populate('module', '-__v');

    if (!category) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// ✅ Get all Categories by ModuleId - FIXED ROUTE
exports.getCategoriesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    
    console.log('Fetching categories for moduleId:', moduleId); // Debug log
    
    if (!moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Module ID is required'
      });
    }

    const categories = await Category.find({ 
      module: moduleId,
      isActive: true // Only return active categories
    })
      .populate('brands', '-__v')
      .populate('module', '-__v')
      .sort({ createdAt: -1 });

    console.log('Found categories:', categories.length); // Debug log

    res.json(categories); // Return array directly to match frontend expectation
  } catch (err) {
    console.error('Error fetching categories by module:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// ✅ Block Category
exports.blockCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }

    category.isActive = false;
    category.updatedBy = req.body.updatedBy;
    category.updatedAt = new Date();

    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('brands', '-__v')
      .populate('module', '-__v');

    res.json({ 
      success: true,
      message: 'Category blocked successfully', 
      category: populatedCategory 
    });
  } catch (err) {
    console.error('Error blocking category:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// ✅ Reactivate Category
exports.reactivateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }

    category.isActive = true;
    category.updatedBy = req.body.updatedBy;
    category.updatedAt = new Date();

    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('brands', '-__v')
      .populate('module', '-__v');

    res.json({ 
      success: true,
      message: 'Category reactivated successfully', 
      category: populatedCategory 
    });
  } catch (err) {
    console.error('Error reactivating category:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};