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
// const fs = require("fs");
// const path = require("path");
// const Category = require("../../models/admin/category");
// const mongoose = require("mongoose");
// const Brand = require("../../models/admin/brand");

// // Utility to delete image file
// const deleteFileIfExists = (filePath) => {
//   if (filePath && fs.existsSync(filePath)) {
//     try {
//       fs.unlinkSync(filePath);
//       console.log(`Deleted file: ${filePath}`);
//     } catch (err) {
//       console.error(`Failed to delete file ${filePath}:`, err);
//     }
//   }
// };

// // ✅ Create Category (with single Module)
// exports.createCategory = async (req, res) => {
//   try {
//     console.log("Request body:", req.body); // Debug log
//     console.log("Request file:", req.file); // Debug log

//     const {
//       title,
//       brands,
//       createdBy,
//       module,
//       description,
//       parentCategory,
//       displayOrder,
//       isActive,
//       isFeatured,
//       metaTitle,
//       metaDescription,
//     } = req.body;

//     // Validate required fields
//     if (!title || !title.trim()) {
//       return res.status(400).json({ error: "Title is required" });
//     }
//     if (!module || !/^[0-9a-fA-F]{24}$/.test(module)) {
//       return res.status(400).json({ error: "Valid module ID is required" });
//     }

//     // Prepare category data
//     const categoryData = {
//       title: title.trim(),
//       description: description ? description.trim() : "",
//       parentCategory: parentCategory ? parentCategory.trim() : "",
//       displayOrder: parseInt(displayOrder) || 0,
//       isActive: isActive === "true",
//       isFeatured: isFeatured === "true",
//       metaTitle: metaTitle ? metaTitle.trim() : "",
//       metaDescription: metaDescription ? metaDescription.trim() : "",
//       brands: brands ? JSON.parse(brands) : [],
//   module,
//       createdBy: createdBy || null,
//       image: req.file ? `/uploads/categories/${req.file.filename}` : null,
//     };

//     console.log("Category data to be created:", categoryData); // Debug log

//     const category = await Category.create(categoryData);

//     const populatedCategory = await Category.findById(category._id)
//       .populate("brands", "-__v")
//       .populate("module", "-__v")
//       .lean();

//     res.status(201).json({
//       success: true,
//       message: "Category created successfully",
//       category: populatedCategory,
//     });
//   } catch (err) {
//     console.error("Error creating category:", err);
//     if (req.file && req.file.path) {
//       deleteFileIfExists(req.file.path); // Clean up uploaded file on error
//     }
//     res.status(err.status || 500).json({
//       success: false,
//       error: err.message || "Internal server error",
//       details: process.env.NODE_ENV === "development" ? err.stack : undefined,
//     });
//   }
// };

// // ✅ Update Category (handle single Module)
// exports.updateCategory = async (req, res) => {
//   try {
//     console.log("Update request body:", req.body); // Debug log
//     console.log("Update request file:", req.file); // Debug log

//     const {
//       title,
//       brands,
//       updatedBy,
//       module,
//       description,
//       parentCategory,
//       displayOrder,
//       isActive,
//       isFeatured,
//       metaTitle,
//       metaDescription,
//     } = req.body;
//     const category = await Category.findById(req.params.id);

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         error: "Category not found",
//       });
//     }

//     // Handle file upload
//     if (req.file) {
//       deleteFileIfExists(path.join(__dirname, `../../${category.image}`));
//       category.image = `/uploads/categories/${req.file.filename}`;
//     }

//     // Update fields if provided
//     if (title) category.title = title.trim();
//     if (description) category.description = description.trim();
//     if (parentCategory) category.parentCategory = parentCategory.trim();
//     if (displayOrder) category.displayOrder = parseInt(displayOrder) || 0;
//     if (isActive !== undefined) category.isActive = isActive === "true";
//     if (isFeatured !== undefined) category.isFeatured = isFeatured === "true";
//     if (metaTitle) category.metaTitle = metaTitle.trim();
//     if (metaDescription) category.metaDescription = metaDescription.trim();
//     if (brands) category.brands = JSON.parse(brands);
//     if (module) category.module = module;
//     if (updatedBy) category.updatedBy = updatedBy;
//     category.updatedAt = new Date();

//     await category.save();

//     const populatedCategory = await Category.findById(category._id)
//       .populate("brands", "-__v")
//       .populate("module", "-__v")
//       .lean();

//     res.json({
//       success: true,
//       message: "Category updated successfully",
//       category: populatedCategory,
//     });
//   } catch (err) {
//     console.error("Error updating category:", err);
//     if (req.file && req.file.path) {
//       deleteFileIfExists(req.file.path); // Clean up uploaded file on error
//     }
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// };

// // ✅ Delete Category
// exports.deleteCategory = async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id);

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         error: "Category not found",
//       });
//     }

//     deleteFileIfExists(path.join(__dirname, `../../${category.image}`));
//     await category.deleteOne();

//     res.json({
//       success: true,
//       message: "Category deleted successfully",
//     });
//   } catch (err) {
//     console.error("Error deleting category:", err);
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// };

// // ✅ Get all Categories (populate brands + module)
// exports.getCategories = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search = "" } = req.query;
//     const query = search ? { title: { $regex: search, $options: "i" } } : {};

//     const categories = await Category.find(query)
//       .populate("brands", "-__v")
//       .populate("module", "-__v")
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(parseInt(limit))
//       .lean();

//     const total = await Category.countDocuments(query);

//     res.json({
//       success: true,
//       data: categories,
//       pagination: {
//         currentPage: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//         totalItems: total,
//         itemsPerPage: parseInt(limit),
//       },
//     });
//   } catch (err) {
//     console.error("Error fetching categories:", err);
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// };

// // ✅ Get single Category (populate brands + module)
// exports.getCategory = async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id)
//       .populate("brands", "-__v")
//       .populate("module", "-__v")
//       .lean();

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         error: "Category not found",
//       });
//     }

//     res.json({
//       success: true,
//       data: category,
//     });
//   } catch (err) {
//     console.error("Error fetching category:", err);
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// };

// // ✅ Get all Categories by ModuleId
// // exports.getCategoriesByModule = async (req, res) => {
// //   try {
// //     const { moduleId } = req.params;

// //     console.log("Fetching categories for moduleId:", moduleId); // Debug log

// //     if (!moduleId || !/^[0-9a-fA-F]{24}$/.test(moduleId)) {
// //       return res.status(400).json({
// //         success: false,
// //         error: "Valid Module ID is required",
// //       });
// //     }

// //     const categories = await Category.find({
// //       module: moduleId,
// //       isActive: true,
// //     })
// //       .populate("brands", "-__v")
// //       .populate("module", "-__v")
// //       .sort({ createdAt: -1 })
// //       .lean();

// //     console.log("Found categories:", categories.length); // Debug log

// //     res.json({
// //       success: true,
// //       data: categories,
// //     });
// //   } catch (err) {
// //     console.error("Error fetching categories by module:", err);
// //     res.status(500).json({
// //       success: false,
// //       error: err.message,
// //     });
// //   }
// // };

// exports.getCategoriesByModule = async (req, res) => {
//   try {
//     const { moduleId } = req.params;

//     console.log("Fetching categories for moduleId:", moduleId);

//     if (!moduleId || !/^[0-9a-fA-F]{24}$/.test(moduleId)) {
//       return res.status(400).json({
//         success: false,
//         error: "Valid Module ID is required",
//       });
//     }

//     const categories = await Category.find({
//       module: moduleId,
//       // Removed isActive filter to show all categories
//     })
//       .populate("brands", "-__v")
//       .populate("module", "-__v")
//       .sort({ createdAt: -1 })
//       .lean();

//     console.log("Found categories:", categories.length);

//     res.json({
//       success: true,
//       data: categories,
//     });
//   } catch (err) {
//     console.error("Error fetching categories by module:", err);
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// };

// // ✅ Block Category
// exports.blockCategory = async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id);

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         error: "Category not found",
//       });
//     }

//     category.isActive = false;
//     category.updatedBy = req.body.updatedBy;
//     category.updatedAt = new Date();

//     await category.save();

//     const populatedCategory = await Category.findById(category._id)
//       .populate("brands", "-__v")
//       .populate("module", "-__v")
//       .lean();

//     res.json({
//       success: true,
//       message: "Category blocked successfully",
//       category: populatedCategory,
//     });
//   } catch (err) {
//     console.error("Error blocking category:", err);
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// };

// // ✅ Reactivate Category
// exports.reactivateCategory = async (req, res) => {
//   try {
//     const category = await Category.findById(req.params.id);

//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         error: "Category not found",
//       });
//     }

//     category.isActive = true;
//     category.updatedBy = req.body.updatedBy;
//     category.updatedAt = new Date();

//     await category.save();

//     const populatedCategory = await Category.findById(category._id)
//       .populate("brands", "-__v")
//       .populate("module", "-__v")
//       .lean();

//     res.json({
//       success: true,
//       message: "Category reactivated successfully",
//       category: populatedCategory,
//     });
//   } catch (err) {
//     console.error("Error reactivating category:", err);
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// };

const fs = require("fs");
const path = require("path");
const Category = require("../../models/admin/category");

/* -----------------------------------------------------
   DELETE FILE UTILITY
----------------------------------------------------- */
const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("File delete error:", err);
    }
  }
};

/* -----------------------------------------------------
   CREATE CATEGORY (Parent or Subcategory)
----------------------------------------------------- */
exports.createCategory = async (req, res) => {
  try {
    const { title, module, parentCategory, brands, createdBy, description } =
      req.body;

    if (!title) return res.status(400).json({ error: "Title required" });
    if (!module) return res.status(400).json({ error: "Module required" });

    const categoryData = {
      title: title.trim(),
      module,
      parentCategory: parentCategory || null,
      description: description || "",
      createdBy: createdBy || null,
      brands: brands ? JSON.parse(brands) : [],
      image: req.file ? `/uploads/categories/${req.file.filename}` : null,
    };

    const newCategory = await Category.create(categoryData);

    // If subcategory → push into parent
    if (parentCategory) {
      await Category.findByIdAndUpdate(parentCategory, {
        $addToSet: { subCategories: newCategory._id },
      });
    }

    const populated = await Category.findById(newCategory._id)
      .populate("module")
      .populate({
        path: "parentCategory",
        populate: {
          path: "subCategories",
          select: "title image",
        },
      })
      .populate("brands")
      .lean();

    res.status(201).json({
      success: true,
      message: parentCategory
        ? "Subcategory created successfully"
        : "Category created successfully",
      category: populated,
    });
  } catch (err) {
    console.error("Create Category Error:", err);
    if (req.file?.path) deleteFileIfExists(req.file.path);
    res.status(500).json({ error: err.message });
  }
};



/* -----------------------------------------------------
   UPDATE CATEGORY
----------------------------------------------------- */
exports.updateCategory = async (req, res) => {
  try {
    const {
      title,
      module,
      parentCategory,
      brands,
      updatedBy,
      description,
      metaTitle,
      metaDescription,
      displayOrder,
      isActive,
      isFeatured,
    } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    if (req.file) {
      deleteFileIfExists(path.join(__dirname, `../../${category.image}`));
      category.image = `/uploads/categories/${req.file.filename}`;
    }

    if (title) category.title = title.trim();
    if (module) category.module = module;
    if (description) category.description = description;
    if (brands) category.brands = JSON.parse(brands);
    if (displayOrder) category.displayOrder = parseInt(displayOrder);
    if (metaTitle) category.metaTitle = metaTitle;
    if (metaDescription) category.metaDescription = metaDescription;
    if (isActive !== undefined) category.isActive = isActive === "true";
    if (isFeatured !== undefined)
      category.isFeatured = isFeatured === "true";

    // Parent change handling
    if (
      parentCategory &&
      parentCategory !== category.parentCategory?.toString()
    ) {
      if (category.parentCategory) {
        await Category.findByIdAndUpdate(category.parentCategory, {
          $pull: { subCategories: category._id },
        });
      }

      await Category.findByIdAndUpdate(parentCategory, {
        $addToSet: { subCategories: category._id },
      });

      category.parentCategory = parentCategory;
    }

    category.updatedBy = updatedBy || null;
    category.updatedAt = new Date();
    await category.save();

    const populated = await Category.findById(category._id)
      .populate("module")
      .populate({
        path: "parentCategory",
        populate: {
          path: "subCategories",
          select: "title image",
        },
      })
      .populate("brands")
      .lean();

    res.json({
      success: true,
      message: "Category updated successfully",
      category: populated,
    });
  } catch (err) {
    console.error("Update Category Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -----------------------------------------------------
   DELETE CATEGORY
----------------------------------------------------- */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    if (category.parentCategory) {
      await Category.findByIdAndUpdate(category.parentCategory, {
        $pull: { subCategories: category._id },
      });
    }

    if (category.image) {
      deleteFileIfExists(path.join(__dirname, `../../${category.image}`));
    }

    await category.deleteOne();
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error("Delete Category Error:", err);
    res.status(500).json({ error: err.message });
  }
};


exports.getParentCategories = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const parents = await Category.find({
      module: moduleId,
      parentCategory: null,
      isActive: true,
    })
      .select('_id title image')
      .lean();

    res.json({
      success: true,
      data: parents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSubCategoriesByParent = async (req, res) => {
  try {
    const { parentId } = req.params;

    const subcategories = await Category.find({
      parentCategory: parentId,
      isActive: true,
    })
      .select('_id title image')
      .lean();

    res.json({
      success: true,
      data: subcategories,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -----------------------------------------------------
   GET ALL CATEGORIES
----------------------------------------------------- */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate("module")
      .populate("parentCategory")
      .populate("subCategories")
      .populate("brands")
      .lean();

    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -----------------------------------------------------
   GET SINGLE CATEGORY
----------------------------------------------------- */
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate("module")
      .populate("parentCategory")
      .populate("subCategories")
      .populate("brands")
      .lean();

    if (!category) return res.status(404).json({ error: "Category not found" });
    res.json({ success: true, data: category });
  } catch (err) {
    console.error("Get Category Error:", err);
    res.status(500).json({ error: err.message });
  }
};


/* -----------------------------------------------------
   GET SUBCATEGORY WITH FULL PARENT TREE
----------------------------------------------------- */
exports.getSubCategoryWithParent = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .populate("module")
      .populate({
        path: "parentCategory",
        populate: {
          path: "subCategories",
          select: "title image",
        },
      })
      .populate("brands")
      .lean();

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (err) {
    console.error("Get SubCategory With Parent Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -----------------------------------------------------
   GET PARENT CATEGORIES BY MODULE (WITH SUBCATEGORIES)
----------------------------------------------------- */
exports.getCategoriesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const categories = await Category.find({
      module: moduleId,
      parentCategory: null,
    })
      .populate("module")
      .populate({
        path: "subCategories",
        select: "title image isActive",
      })
      .lean();

    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
/* -----------------------------------------------------
   GET ALL SUBCATEGORIES BY MODULE
----------------------------------------------------- */
exports.getAllSubCategoriesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const subcategories = await Category.find({
      module: moduleId,
      parentCategory: { $ne: null },
      isActive: true,
    })
      .populate("parentCategory", "title")
      .select("_id title image parentCategory")
      .lean();

    res.json({
      success: true,
      data: subcategories,
    });
  } catch (err) {
    console.error("Get Subcategories By Module Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -----------------------------------------------------
   GET SUBCATEGORIES UNDER A PARENT
----------------------------------------------------- */
exports.getSubCategories = async (req, res) => {
  try {
    const { parentId } = req.params;

    const subcategories = await Category.find({
      parentCategory: parentId,
    })
      .populate("module")
      .populate("brands")
      .lean();

    res.json({ success: true, data: subcategories });
  } catch (err) {
    console.error("Get Subcategories Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* -----------------------------------------------------
   BLOCK CATEGORY
----------------------------------------------------- */
exports.blockCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    category.isActive = false;
    category.updatedAt = new Date();
    await category.save();

    res.json({ success: true, message: "Category blocked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* -----------------------------------------------------
   REACTIVATE CATEGORY
----------------------------------------------------- */
exports.reactivateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: "Category not found" });

    category.isActive = true;
    category.updatedAt = new Date();
    await category.save();

    res.json({ success: true, message: "Category reactivated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
