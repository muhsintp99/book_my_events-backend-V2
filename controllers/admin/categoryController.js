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

// ✅ Create Category (with single Module)
exports.createCategory = async (req, res) => {
  try {
    const { title, brands, createdBy, Module } = req.body;

    if (!Module) {
      return res.status(400).json({ error: 'Module is required' });
    }

    const categoryData = {
      title,
      brands: brands ? JSON.parse(brands) : [],
      Module, // single module reference
      createdBy,
      image: req.file ? `uploads/categories/${req.file.filename}` : null
    };

    const category = await Category.create(categoryData);

    const populatedCategory = await Category.findById(category._id)
      .populate('brands', '-__v')
      .populate('module', '-__v');

    res.status(201).json({ message: 'Category created', category: populatedCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Category (handle single Module)
exports.updateCategory = async (req, res) => {
  try {
    const { title, brands, updatedBy, module } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    if (req.file) {
      deleteFileIfExists(path.join(__dirname, `../../${category.image}`));
      category.image = `uploads/categories/${req.file.filename}`;
    }

    if (title) category.title = title;
    if (brands) category.brands = JSON.parse(brands);
    if (module) category.module = module;
    if (updatedBy) category.updatedBy = updatedBy;

    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('brands', '-__v')
      .populate('module', '-__v');

    res.json({ message: 'Category updated', category: populatedCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    deleteFileIfExists(path.join(__dirname, `../../${category.image}`));
    await category.deleteOne();

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



// ✅ Get all Categories (populate brands + module)
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate('brands', '-__v')
      .populate('module', '-__v');

    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get single Category (populate brands + module)
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('brands', '-__v')
      .populate('module', '-__v');

    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get all Categories by ModuleId
exports.getCategoriesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const categories = await Category.find({ module: moduleId })
      .populate('brands', '-__v')
      .populate('module', '-__v');

    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Block Category
exports.blockCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    category.isActive = false;
    category.updatedBy = req.body.updatedBy;
    category.updatedAt = new Date();

    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('brands', '-__v')
      .populate('module', '-__v');

    res.json({ message: 'Category blocked', category: populatedCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Reactivate Category
exports.reactivateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    category.isActive = true;
    category.updatedBy = req.body.updatedBy;
    category.updatedAt = new Date();

    await category.save();

    const populatedCategory = await Category.findById(category._id)
      .populate('brands', '-__v')
      .populate('module', '-__v');

    res.json({ message: 'Category reactivated', category: populatedCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
