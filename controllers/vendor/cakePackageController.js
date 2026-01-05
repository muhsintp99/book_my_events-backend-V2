const Cake = require("../../models/vendor/cakePackageModel");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const Category = require("../../models/admin/category");

/* =====================================================
   HELPERS
===================================================== */
const generateCakeId = () => {
  return `CAKE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const sendResponse = (res, status, success, message, data = null, meta = null) => {
  const response = { success, message };
  if (data) response.data = data;
  if (meta) response.meta = meta;
  return res.status(status).json(response);
};

const deleteFiles = async (files = []) => {
  if (!files.length) return;
  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.unlink(path.resolve(file));
      } catch (err) {
        if (err.code !== "ENOENT") console.error("Delete error:", err);
      }
    })
  );
};

const parseJSON = (value, fallback) => {
  if (!value) return fallback;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

const parseObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

/* =====================================================
   SANITIZE BODY
===================================================== */

const sanitizeCakeData = (body) => {
  const data = { ...body };

  if (data.name) data.name = data.name.trim();
  if (data.shortDescription) data.shortDescription = data.shortDescription.trim();

  data.isActive = data.isActive !== undefined ? String(data.isActive) === "true" : true;
  data.isTopPick = data.isTopPick !== undefined ? String(data.isTopPick) === "true" : false;
  data.isHalal = data.isHalal !== undefined ? String(data.isHalal) === "true" : false;

  if (data.category) data.category = parseObjectId(data.category);

  if (data.subCategories) {
    data.subCategories = parseJSON(data.subCategories, [])
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
  }

  data.nutrition = parseJSON(data.nutrition, []);
  data.allergenIngredients = parseJSON(data.allergenIngredients, []);
  data.searchTags = parseJSON(data.searchTags, []);
  data.variations = parseJSON(data.variations, []);
  data.timeSchedule = parseJSON(data.timeSchedule, {});
  data.priceInfo = parseJSON(data.priceInfo, {});

  return data;
};

/* =====================================================
   CREATE CAKE
===================================================== */

exports.createCake = async (req, res) => {
  const body = sanitizeCakeData(req.body);

  try {
    if (!body.category) {
      return sendResponse(res, 400, false, "Category is required");
    }

    const categoryExists = await Category.findById(body.category);
    if (!categoryExists) {
      return sendResponse(res, 400, false, "Invalid category");
    }

    // Provider auto-assign
    if (req.user) body.provider = req.user._id;

    // Files
    if (!req.files?.thumbnail?.[0]) {
      return sendResponse(res, 400, false, "Thumbnail is required");
    }

    body.thumbnail = req.files.thumbnail[0].path;
    body.images = req.files?.images?.map((f) => f.path) || [];

body.cakeId = generateCakeId();

const cake = await Cake.create(body);

    const populatedCake = await Cake.findById(cake._id)
      .populate("category subCategories provider")
      .lean();

    sendResponse(res, 201, true, "Cake created successfully", populatedCake);
  } catch (error) {
    if (body.images) await deleteFiles(body.images);
    if (body.thumbnail) await deleteFiles([body.thumbnail]);

    console.error("CREATE CAKE ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   GET ALL CAKES (ADMIN / PUBLIC)
===================================================== */

exports.getAllCakes = async (req, res) => {
  try {
    const cakes = await Cake.find()
      .populate("category subCategories provider")
      .sort({ createdAt: -1 })
      .lean();

    sendResponse(res, 200, true, "Cakes fetched", cakes, {
      count: cakes.length
    });
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   GET SINGLE CAKE
===================================================== */

exports.getCakeById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendResponse(res, 400, false, "Invalid cake ID");
    }

    const cake = await Cake.findById(req.params.id)
      .populate("category subCategories provider")
      .lean();

    if (!cake) {
      return sendResponse(res, 404, false, "Cake not found");
    }

    sendResponse(res, 200, true, "Cake fetched", cake);
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   ✅ GET CAKES BY PROVIDER (LIKE VEHICLE)
===================================================== */

exports.getCakesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10, isActive } = req.query;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return sendResponse(res, 400, false, "Invalid provider ID");
    }

    const query = { provider: providerId };
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [cakes, total] = await Promise.all([
      Cake.find(query)
        .populate("category subCategories provider")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Cake.countDocuments(query),
    ]);

    sendResponse(res, 200, true, "Provider cakes fetched", cakes, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("GET CAKES BY PROVIDER ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   UPDATE CAKE
===================================================== */

exports.updateCake = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) {
      return sendResponse(res, 404, false, "Cake not found");
    }

    // Vendor authorization
    if (req.user?.role === "vendor" &&
        cake.provider?.toString() !== req.user._id.toString()) {
      return sendResponse(res, 403, false, "Unauthorized");
    }

    const body = sanitizeCakeData(req.body);
    const filesToDelete = [];

    if (req.files?.thumbnail?.[0]) {
      if (cake.thumbnail) filesToDelete.push(cake.thumbnail);
      body.thumbnail = req.files.thumbnail[0].path;
    }

    if (req.files?.images) {
      if (cake.images?.length) filesToDelete.push(...cake.images);
      body.images = req.files.images.map((f) => f.path);
    }

    Object.assign(cake, body);
    await cake.save();

    if (filesToDelete.length) await deleteFiles(filesToDelete);

    const updatedCake = await Cake.findById(cake._id)
      .populate("category subCategories provider")
      .lean();

    sendResponse(res, 200, true, "Cake updated", updatedCake);
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   DELETE CAKE
===================================================== */

exports.deleteCake = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) {
      return sendResponse(res, 404, false, "Cake not found");
    }

    // Vendor authorization
    if (req.user?.role === "vendor" &&
        cake.provider?.toString() !== req.user._id.toString()) {
      return sendResponse(res, 403, false, "Unauthorized");
    }

    const filesToDelete = [];
    if (cake.thumbnail) filesToDelete.push(cake.thumbnail);
    if (cake.images?.length) filesToDelete.push(...cake.images);

    await cake.deleteOne();
    if (filesToDelete.length) await deleteFiles(filesToDelete);

    sendResponse(res, 200, true, "Cake deleted");
  } catch (error) {
    sendResponse(res, 500, false, error.message);
  }
};
