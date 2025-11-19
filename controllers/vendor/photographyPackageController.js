const Photography = require("../../models/vendor/PhotographyPackage");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// ---------------------- Helper: Parse JSON or array ----------------------
const parseField = (field) => {
  if (!field) return [];
  try {
    return Array.isArray(field) ? field : JSON.parse(field);
  } catch {
    return [field];
  }
};

// ---------------------- Helper: Delete file ----------------------
const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// ---------------------- Helper: Populate Photography Package ----------------------
const populatePhotography = async (id) => {
  return await Photography.findById(id)
    .populate("module", "-__v")
    .populate("categories", "-__v")
    .populate("provider", "firstName lastName email phone")
    .populate("createdBy", "firstName lastName email phone");
};

// --------------------------------------------------------------------------
// CREATE PHOTOGRAPHY PACKAGE
// --------------------------------------------------------------------------
exports.createPhotographyPackage = async (req, res) => {
  try {
    const {
      module,
      categories,
      packageTitle,
      description,
      photographyType,
      includedServices,
      price,   // <-- updated
      travelToVenue,
      advanceBookingAmount,
      cancellationPolicy,
      providerId,
      createdBy
    } = req.body;

    if (!packageTitle)
      return res.status(400).json({ success: false, message: "Package title is required" });

    if (!providerId)
      return res.status(400).json({ success: false, message: "Provider ID is required" });

    if (!price)
      return res.status(400).json({ success: false, message: "Price is required" });

    const photographyId = `PHP-${uuidv4()}`;

    const parsedCategories = parseField(categories);
    const parsedIncludes = parseField(includedServices);

    const gallery = req.files?.gallery
      ? req.files.gallery.map((file) => `uploads/photography/${file.filename}`)
      : [];

    const pkg = await Photography.create({
      photographyId,
      module,
      categories: parsedCategories,
      packageTitle,
      description,
      photographyType,
      includedServices: parsedIncludes,
      price,
      travelToVenue,
      advanceBookingAmount,
      cancellationPolicy,
      gallery,
      provider: providerId,
      createdBy
    });

    const populated = await populatePhotography(pkg._id);

    res.status(201).json({
      success: true,
      message: "Photography package created successfully",
      data: populated
    });
  } catch (err) {
    console.error("Create Photography Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// UPDATE PHOTOGRAPHY PACKAGE
// --------------------------------------------------------------------------
exports.updatePhotographyPackage = async (req, res) => {
  try {
    const pkg = await Photography.findById(req.params.id);
    if (!pkg)
      return res.status(404).json({ success: false, message: "Photography package not found" });

    const {
      module,
      categories,
      packageTitle,
      description,
      photographyType,
      includedServices,
      price,
      travelToVenue,
      advanceBookingAmount,
      cancellationPolicy,
      updatedBy
    } = req.body;

    if (categories) pkg.categories = parseField(categories);
    if (includedServices) pkg.includedServices = parseField(includedServices);

    if (req.files?.gallery) {
      pkg.gallery.forEach((imgPath) =>
        deleteFileIfExists(path.join(__dirname, `../../${imgPath}`))
      );
      pkg.gallery = req.files.gallery.map((file) => `uploads/photography/${file.filename}`);
    }

    if (packageTitle) pkg.packageTitle = packageTitle.trim();
    if (description) pkg.description = description;
    if (photographyType) pkg.photographyType = photographyType;
    if (module) pkg.module = module;
    if (price) pkg.price = price;

    if (travelToVenue !== undefined) pkg.travelToVenue = travelToVenue;
    if (advanceBookingAmount) pkg.advanceBookingAmount = advanceBookingAmount;
    if (cancellationPolicy) pkg.cancellationPolicy = cancellationPolicy;

    pkg.updatedBy = updatedBy || pkg.updatedBy;

    await pkg.save();

    const populated = await populatePhotography(pkg._id);

    res.json({
      success: true,
      message: "Photography package updated successfully",
      data: populated
    });
  } catch (err) {
    console.error("Update Photography Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// DELETE PHOTOGRAPHY PACKAGE
// --------------------------------------------------------------------------
exports.deletePhotographyPackage = async (req, res) => {
  try {
    const pkg = await Photography.findById(req.params.id);
    if (!pkg)
      return res.status(404).json({ success: false, message: "Photography package not found" });

    pkg.gallery.forEach((imgPath) =>
      deleteFileIfExists(path.join(__dirname, `../../${imgPath}`))
    );

    await pkg.deleteOne();

    res.json({
      success: true,
      message: "Photography package deleted successfully"
    });
  } catch (err) {
    console.error("Delete Photography Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// GET ALL PHOTOGRAPHY PACKAGES
// --------------------------------------------------------------------------
exports.getAllPhotographyPackages = async (req, res) => {
  try {
    const { search, module } = req.query;

    let query = {};

    if (search && search.trim()) query.$text = { $search: search };
    if (module && mongoose.Types.ObjectId.isValid(module)) query.module = module;

    const pkgs = await Photography.find(query)
      .populate("module", "title images isActive")
      .populate("categories", "title image")
      .populate("provider", "firstName lastName email phone")
      .sort({ isTopPick: -1, createdAt: -1 });

    res.json({
      success: true,
      count: pkgs.length,
      data: pkgs
    });
  } catch (err) {
    console.error("Get All Photography Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// GET PHOTOGRAPHY BY ID
// --------------------------------------------------------------------------
exports.getPhotographyPackageById = async (req, res) => {
  try {
    const pkg = await populatePhotography(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: pkg });
  } catch (err) {
    console.error("Get Photography Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// GET BY PROVIDER
// --------------------------------------------------------------------------
exports.getPhotographyByProvider = async (req, res) => {
  try {
    const pkgs = await Photography.find({ provider: req.params.providerId })
      .populate("module", "title images isActive")
      .populate("categories", "title image")
      .populate("provider", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pkgs.length,
      data: pkgs
    });
  } catch (err) {
    console.error("Get Photography By Provider Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// GET BY MODULE
// --------------------------------------------------------------------------
exports.getPhotographyByModule = async (req, res) => {
  try {
    const pkgs = await Photography.find({ module: req.params.moduleId })
      .populate("module")
      .populate("categories")
      .populate("provider")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pkgs.length,
      data: pkgs
    });
  } catch (err) {
    console.error("Get Photography By Module Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// TOGGLE TOP PICK
// --------------------------------------------------------------------------
exports.toggleTopPickStatus = async (req, res) => {
  try {
    const pkg = await Photography.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: "Photography not found" });

    pkg.isTopPick = !pkg.isTopPick;
    await pkg.save();

    const populated = await populatePhotography(pkg._id);

    res.json({
      success: true,
      message: `Photography ${pkg.isTopPick ? "marked as Top Pick" : "removed from Top Pick"}`,
      data: populated
    });
  } catch (err) {
    console.error("Toggle Top Pick Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// GET TOP PICK PHOTOGRAPHY PACKAGES
// --------------------------------------------------------------------------
exports.getTopPickPhotographies = async (req, res) => {
  try {
    const pkgs = await Photography.find({ isTopPick: true, isActive: true })
      .populate("module", "-__v")
      .populate("categories", "-__v")
      .populate("provider", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Top pick photography packages fetched successfully",
      count: pkgs.length,
      data: pkgs,
    });
  } catch (err) {
    console.error("Get Top Pick Photographies Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// TOGGLE ACTIVE STATUS
// --------------------------------------------------------------------------
exports.toggleActiveStatus = async (req, res) => {
  try {
    const pkg = await Photography.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: "Photography not found" });

    pkg.isActive = !pkg.isActive;
    await pkg.save();

    const populated = await populatePhotography(pkg._id);

    res.json({
      success: true,
      message: `Photography ${pkg.isActive ? "activated" : "deactivated"}`,
      data: populated
    });
  } catch (err) {
    console.error("Toggle Active Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
