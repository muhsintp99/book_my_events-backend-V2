const CakePackage = require("../../models/vendor/cakePackageModel");
const Category = require("../../models/admin/category");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

/* =====================================================
   HELPERS
===================================================== */

const parseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    return JSON.parse(value);
  } catch {
    return value
      .replace(/[\[\]"']/g, "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
};

const parseObject = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const deleteFiles = (files = []) => {
  files.forEach((file) => {
    const filePath = path.join(__dirname, `../../${file}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

/* =====================================================
   CREATE CAKE PACKAGE
===================================================== */
exports.createCakePackage = async (req, res) => {
  try {
    const body = { ...req.body };

    body.provider = req.user._id;
    body.nutrition = parseArray(body.nutrition);
    body.allergenIngredients = parseArray(body.allergenIngredients);
    body.subCategories = parseArray(body.subCategories);
    body.timeSchedule = parseObject(body.timeSchedule);
    body.priceInfo = parseObject(body.priceInfo);

    /* ================= IMAGES ================= */

    if (req.files?.thumbnail?.[0]) {
      body.thumbnail = `/uploads/cake/${req.files.thumbnail[0].filename}`;
    }

    if (req.files?.gallery) {
      body.gallery = req.files.gallery.map(
        (f) => `/uploads/cake/${f.filename}`
      );
    }

    /* ================= CATEGORY VALIDATION ================= */

    const parentCategory = await Category.findById(body.category).lean();
    if (!parentCategory) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    if (body.subCategories?.length) {
      const validSubIds = parentCategory.subCategories.map((s) =>
        s._id.toString()
      );

      body.subCategories = body.subCategories.filter((id) =>
        validSubIds.includes(id.toString())
      );
    }

    const cake = await CakePackage.create(body);

    res.status(201).json({
      success: true,
      message: "Cake package created successfully",
      data: cake,
    });
  } catch (err) {
    console.error("Create Cake Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   GET ALL CAKES (VENDOR)
===================================================== */
exports.getAllCakePackages = async (req, res) => {
  try {
    const cakes = await CakePackage.find({ provider: req.user._id })
      .populate({
        path: "category",
        select: "title image subCategories",
      })
      .lean();

    for (const cake of cakes) {
      if (cake.subCategories?.length) {
        cake.subCategories = cake.category.subCategories
          .filter((sub) =>
            cake.subCategories.map(String).includes(sub._id.toString())
          )
          .map((sub) => ({
            _id: sub._id,
            title: sub.title,
            image: sub.image,
          }));
      }
      delete cake.category.subCategories;
    }

    res.json({
      success: true,
      count: cakes.length,
      data: cakes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   GET CAKES BY PROVIDER (PUBLIC)
===================================================== */
exports.getCakesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID",
      });
    }

    const cakes = await CakePackage.find({
      provider: providerId,
      isActive: true,
    })
      .populate("category", "title image")
      .lean();

    res.json({
      success: true,
      count: cakes.length,
      data: cakes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   GET SINGLE CAKE
===================================================== */
exports.getCakePackageById = async (req, res) => {
  try {
    const cake = await CakePackage.findById(req.params.id)
      .populate("category", "title image subCategories")
      .lean();

    if (!cake)
      return res.status(404).json({ success: false, message: "Not found" });

    if (cake.subCategories?.length) {
      cake.subCategories = cake.category.subCategories
        .filter((sub) =>
          cake.subCategories.map(String).includes(sub._id.toString())
        )
        .map((sub) => ({
          _id: sub._id,
          title: sub.title,
          image: sub.image,
        }));
    }

    delete cake.category.subCategories;

    res.json({ success: true, data: cake });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   SEARCH CAKES
===================================================== */
exports.searchCakePackages = async (req, res) => {
  try {
    const { keyword } = req.query;

    const query = { isActive: true };

    if (keyword) {
      query.$or = [
        { name: new RegExp(keyword, "i") },
        { itemType: new RegExp(keyword, "i") },
      ];
    }

    const cakes = await CakePackage.find(query)
      .populate("category", "title image")
      .lean();

    res.json({
      success: true,
      count: cakes.length,
      data: cakes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   TOGGLES
===================================================== */
exports.toggleTopPickStatus = async (req, res) => {
  const cake = await CakePackage.findById(req.params.id);
  if (!cake)
    return res.status(404).json({ success: false, message: "Not found" });

  cake.isTopPick = !cake.isTopPick;
  await cake.save();

  res.json({ success: true, isTopPick: cake.isTopPick });
};
/* =====================================================
   GET TOP PICK CAKES (PUBLIC)
===================================================== */
exports.getTopPickCakes = async (req, res) => {
  try {
    const cakes = await CakePackage.find({
      isTopPick: true,
      isActive: true,
    })
      .populate("category", "title image")
      .lean();

    res.json({
      success: true,
      count: cakes.length,
      data: cakes,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.toggleActiveStatus = async (req, res) => {
  const cake = await CakePackage.findById(req.params.id);
  if (!cake)
    return res.status(404).json({ success: false, message: "Not found" });

  cake.isActive = !cake.isActive;
  await cake.save();

  res.json({ success: true, isActive: cake.isActive });
};

/* =====================================================
   UPDATE CAKE
===================================================== */
exports.updateCakePackage = async (req, res) => {
  try {
    const cake = await CakePackage.findById(req.params.id);
    if (!cake)
      return res.status(404).json({ success: false, message: "Not found" });

    if (cake.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const body = { ...req.body };
    body.subCategories = parseArray(body.subCategories);
    body.priceInfo = parseObject(body.priceInfo);

    if (body.category) {
      const parent = await Category.findById(body.category).lean();
      if (!parent)
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });

      if (body.subCategories?.length) {
        const validSubIds = parent.subCategories.map((s) =>
          s._id.toString()
        );
        body.subCategories = body.subCategories.filter((id) =>
          validSubIds.includes(id.toString())
        );
      }
    }

    /* ================= IMAGE UPDATE ================= */

    if (req.files?.thumbnail?.[0]) {
      if (cake.thumbnail) deleteFiles([cake.thumbnail]);
      body.thumbnail = `/uploads/cake/${req.files.thumbnail[0].filename}`;
    }

    if (req.files?.gallery) {
      deleteFiles(cake.gallery || []);
      body.gallery = req.files.gallery.map(
        (f) => `/uploads/cake/${f.filename}`
      );
    }

    Object.assign(cake, body);
    await cake.save();

    res.json({
      success: true,
      message: "Cake updated successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   DELETE CAKE
===================================================== */
exports.deleteCakePackage = async (req, res) => {
  const cake = await CakePackage.findById(req.params.id);
  if (!cake)
    return res.status(404).json({ success: false, message: "Not found" });

  if (cake.provider.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }

  deleteFiles(cake.gallery || []);
  if (cake.thumbnail) deleteFiles([cake.thumbnail]);

  await cake.deleteOne();

  res.json({
    success: true,
    message: "Cake deleted successfully",
  });
};
