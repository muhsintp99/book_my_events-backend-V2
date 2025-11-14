const Makeup = require("../../models/admin/makeupPackageModel");
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

// ---------------------- Helper: Populate Makeup Package ----------------------
const populateMakeup = async (id) => {
  return await Makeup.findById(id)
    .populate("module", "-__v")
    .populate("categories", "-__v")
    .populate("provider", "firstName lastName email phone")
    .populate("createdBy", "firstName lastName email phone");
};

// --------------------------------------------------------------------------
// ⭐ CREATE MAKEUP PACKAGE
// --------------------------------------------------------------------------
exports.createMakeupPackage = async (req, res) => {
  try {
    const {
      module,
      categories,
      packageTitle,
      duration,
      description,
      makeupType,
      includedServices,
      basePrice,
      taxPercentage,
      offerPrice,
      trialMakeupIncluded,
      travelToVenue,
      advanceBookingAmount,
      cancellationPolicy,
      providerId,
      createdBy
    } = req.body;

    if (!packageTitle) return res.status(400).json({ success: false, message: "Package title is required" });
    if (!providerId) return res.status(400).json({ success: false, message: "Provider ID is required" });

    const makeupId = `MUP-${uuidv4()}`;

    // Parse categories & includes JSON
    const parsedCategories = parseField(categories);
    const parsedIncludes = parseField(includedServices);

    // Gallery upload
    const gallery = req.files?.gallery
      ? req.files.gallery.map((file) => `uploads/makeup/${file.filename}`)
      : [];

    const finalPrice =
      Number(basePrice || 0) +
      (Number(basePrice || 0) * Number(taxPercentage || 0)) / 100 -
      Number(offerPrice || 0);

    const makeup = await Makeup.create({
      makeupId,
      module,
      categories: parsedCategories,
      packageTitle,
      duration,
      description,
      makeupType,
      includedServices: parsedIncludes,
      basePrice,
      taxPercentage,
      offerPrice,
      finalPrice,
      trialMakeupIncluded,
      travelToVenue,
      advanceBookingAmount,
      cancellationPolicy,
      gallery,
      provider: providerId,
      createdBy
    });

    const populated = await populateMakeup(makeup._id);

    res.status(201).json({
      success: true,
      message: "Makeup package created successfully",
      data: populated
    });

  } catch (err) {
    console.error("❌ Create Makeup Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// ⭐ UPDATE MAKEUP PACKAGE
// --------------------------------------------------------------------------
exports.updateMakeupPackage = async (req, res) => {
  try {
    const makeup = await Makeup.findById(req.params.id);
    if (!makeup) return res.status(404).json({ success: false, message: "Makeup package not found" });

    const {
      module,
      categories,
      packageTitle,
      duration,
      description,
      makeupType,
      includedServices,
      basePrice,
      taxPercentage,
      offerPrice,
      trialMakeupIncluded,
      travelToVenue,
      advanceBookingAmount,
      cancellationPolicy,
      updatedBy
    } = req.body;

    // Parse fields
    if (categories) makeup.categories = parseField(categories);
    if (includedServices) makeup.includedServices = parseField(includedServices);

    // Replace gallery (if new images uploaded)
    if (req.files?.gallery) {
      makeup.gallery.forEach((imgPath) =>
        deleteFileIfExists(path.join(__dirname, `../../${imgPath}`))
      );

      makeup.gallery = req.files.gallery.map(
        (file) => `uploads/makeup/${file.filename}`
      );
    }

    // Update remaining fields
    if (packageTitle) makeup.packageTitle = packageTitle.trim();
    if (duration) makeup.duration = duration;
    if (description) makeup.description = description;
    if (makeupType) makeup.makeupType = makeupType;

    if (module) makeup.module = module;

    if (basePrice) makeup.basePrice = basePrice;
    if (taxPercentage) makeup.taxPercentage = taxPercentage;
    if (offerPrice) makeup.offerPrice = offerPrice;

    makeup.finalPrice =
      Number(makeup.basePrice || 0) +
      (Number(makeup.basePrice || 0) * Number(makeup.taxPercentage || 0)) / 100 -
      Number(makeup.offerPrice || 0);

    if (trialMakeupIncluded) makeup.trialMakeupIncluded = trialMakeupIncluded;
    if (travelToVenue) makeup.travelToVenue = travelToVenue;
    if (advanceBookingAmount) makeup.advanceBookingAmount = advanceBookingAmount;
    if (cancellationPolicy) makeup.cancellationPolicy = cancellationPolicy;

    makeup.updatedBy = updatedBy || makeup.updatedBy;

    await makeup.save();

    const populated = await populateMakeup(makeup._id);

    res.json({
      success: true,
      message: "Makeup package updated successfully",
      data: populated
    });

  } catch (err) {
    console.error("❌ Update Makeup Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// ⭐ DELETE MAKEUP PACKAGE
// --------------------------------------------------------------------------
exports.deleteMakeupPackage = async (req, res) => {
  try {
    const makeup = await Makeup.findById(req.params.id);
    if (!makeup) return res.status(404).json({ success: false, message: "Makeup package not found" });

    makeup.gallery.forEach((imgPath) =>
      deleteFileIfExists(path.join(__dirname, `../../${imgPath}`))
    );

    await makeup.deleteOne();

    res.json({
      success: true,
      message: "Makeup package deleted successfully"
    });

  } catch (err) {
    console.error("❌ Delete Makeup Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// ⭐ GET ALL MAKEUP PACKAGES
// --------------------------------------------------------------------------
exports.getAllMakeupPackages = async (req, res) => {
  try {
    const { search, module } = req.query;

    let query = {};

    if (search && search.trim()) {
      query.$text = { $search: search };
    }

    if (module && mongoose.Types.ObjectId.isValid(module)) {
      query.module = module;
    }

    const makeups = await Makeup.find(query)
      .populate("module", "title images isActive")
      .populate("categories", "title image")
      .populate("provider", "firstName lastName email phone")
      .sort({ isTopPick: -1, createdAt: -1 });

    res.json({
      success: true,
      count: makeups.length,
      data: makeups
    });

  } catch (err) {
    console.error("❌ Get All Makeups Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// ⭐ GET MAKEUP BY ID
// --------------------------------------------------------------------------
exports.getMakeupPackageById = async (req, res) => {
  try {
    const makeup = await populateMakeup(req.params.id);

    if (!makeup)
      return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: makeup });

  } catch (err) {
    console.error("❌ Get Makeup Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// ⭐ GET MAKEUP BY PROVIDER
// --------------------------------------------------------------------------
exports.getMakeupByProvider = async (req, res) => {
  try {
    const makeups = await Makeup.find({
      provider: req.params.providerId
    })
      .populate("module", "title images isActive")
      .populate("categories", "title image")
      .populate("provider", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: makeups.length,
      data: makeups
    });

  } catch (err) {
    console.error("❌ Get Makeup By Provider Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// ⭐ GET MAKEUP BY MODULE
// --------------------------------------------------------------------------
exports.getMakeupByModule = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;

    const makeups = await Makeup.find({ module: moduleId })
      .populate("module")
      .populate("categories")
      .populate("provider")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: makeups.length,
      data: makeups
    });

  } catch (err) {
    console.error("❌ Get Makeup By Module Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// ⭐ TOGGLE TOP PICK STATUS
// --------------------------------------------------------------------------
exports.toggleTopPickStatus = async (req, res) => {
  try {
    const pkg = await Makeup.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: "Makeup not found" });

    pkg.isTopPick = !pkg.isTopPick;
    await pkg.save();

    const populated = await populateMakeup(pkg._id);

    res.json({
      success: true,
      message: `Makeup ${pkg.isTopPick ? "marked as Top Pick" : "removed from Top Pick"}`,
      data: populated
    });

  } catch (err) {
    console.error("❌ Toggle Top Pick Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// ⭐ GET TOP PICK MAKEUP PACKAGES
// --------------------------------------------------------------------------
exports.getTopPickMakeups = async (req, res) => {
  try {
    const makeups = await Makeup.find({ isTopPick: true, isActive: true })
      .populate("module", "-__v")
      .populate("categories", "-__v")
      .populate("provider", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Top pick makeup packages fetched successfully",
      count: makeups.length,
      data: makeups
    });
  } catch (err) {
    console.error("❌ Get Top Pick Makeups Error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// --------------------------------------------------------------------------
// ⭐ TOGGLE ACTIVE/INACTIVE STATUS
// --------------------------------------------------------------------------
exports.toggleActiveStatus = async (req, res) => {
  try {
    const pkg = await Makeup.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, message: "Makeup not found" });

    pkg.isActive = !pkg.isActive;
    await pkg.save();

    const populated = await populateMakeup(pkg._id);

    res.json({
      success: true,
      message: `Makeup ${pkg.isActive ? "activated" : "deactivated"}`,
      data: populated
    });

  } catch (err) {
    console.error("❌ Toggle Active Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
