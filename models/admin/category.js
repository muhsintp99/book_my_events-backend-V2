const mongoose = require("mongoose");
const { Schema } = mongoose;

const CategorySchema = new Schema(
  {
    categoryId: { type: String, unique: true, required: true },
    title: { type: String, required: true, trim: true },

    image: { type: String },

    // Parent or Subcategory
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // Children (subcategories)
    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],

    // Module
    module: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "moduleModel",
    },
    moduleModel: {
      type: String,
      required: true,
      enum: ["Module", "SecondaryModule"],
      default: "Module",
    },

    brands: [{ type: mongoose.Schema.Types.ObjectId, ref: "Brand" }],

    description: { type: String, default: "" },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Generate CategoryId
CategorySchema.pre("validate", async function (next) {
  if (this.isNew && !this.categoryId) {
    try {
      const year = new Date().getFullYear();
      const prefix = `CAT${year}`;

      const categories = await mongoose
        .model("Category")
        .find({ categoryId: { $regex: `^${prefix}` } })
        .select("categoryId")
        .lean();

      let nextNumber = 1;

      if (categories.length > 0) {
        const numbers = categories
          .map((cat) => parseInt(cat.categoryId.replace(prefix, ""), 10))
          .filter((num) => !isNaN(num));

        if (numbers.length > 0) {
          nextNumber = Math.max(...numbers) + 1;
        }
      }

      const serial = String(nextNumber).padStart(3, "0");
      this.categoryId = `${prefix}${serial}`;

      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Category", CategorySchema);

