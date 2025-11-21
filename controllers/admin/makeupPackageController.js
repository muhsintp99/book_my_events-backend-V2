const Makeup = require("../../models/admin/makeupPackageModel");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("../../models/vendor/Profile");

const User = require("../../models/User");

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
// CREATE MAKEUP PACKAGE
// --------------------------------------------------------------------------
exports.createMakeupPackage = async (req, res) => {
  try {
    const {
      module,
      categories,
      packageTitle,
      description,
      makeupType,
      includedServices,
      basePrice,
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

    const parsedCategories = parseField(categories);
    const parsedIncludes = parseField(includedServices);

    const gallery = req.files?.gallery
      ? req.files.gallery.map((file) => `/uploads/makeup/${file.filename}`)
      : [];

    const finalPrice = Number(basePrice || 0) - Number(offerPrice || 0);

    const makeup = await Makeup.create({
      makeupId,
      module,
      categories: parsedCategories,
      packageTitle,
      description,
      makeupType,
      includedServices: parsedIncludes,
      basePrice,
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
    console.error("Create Makeup Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// UPDATE MAKEUP PACKAGE
// --------------------------------------------------------------------------
exports.updateMakeupPackage = async (req, res) => {
  try {
    const makeup = await Makeup.findById(req.params.id);
    if (!makeup) return res.status(404).json({ success: false, message: "Makeup package not found" });

    const {
      module,
      categories,
      packageTitle,
      description,
      makeupType,
      includedServices,
      basePrice,
      offerPrice,
      trialMakeupIncluded,
      travelToVenue,
      advanceBookingAmount,
      cancellationPolicy,
      updatedBy
    } = req.body;

    if (categories) makeup.categories = parseField(categories);
    if (includedServices) makeup.includedServices = parseField(includedServices);

    if (req.files?.gallery) {
      makeup.gallery.forEach((imgPath) =>
        deleteFileIfExists(path.join(__dirname, `../../${imgPath}`))
      );
      makeup.gallery = req.files.gallery.map((file) => `/uploads/makeup/${file.filename}`);
    }

    if (packageTitle) makeup.packageTitle = packageTitle.trim();
    if (description) makeup.description = description;
    if (makeupType) makeup.makeupType = makeupType;
    if (module) makeup.module = module;

    if (basePrice) makeup.basePrice = basePrice;
    if (offerPrice !== undefined) makeup.offerPrice = offerPrice;

    makeup.finalPrice = Number(makeup.basePrice || 0) - Number(makeup.offerPrice || 0);

    if (trialMakeupIncluded !== undefined) makeup.trialMakeupIncluded = trialMakeupIncluded;
    if (travelToVenue !== undefined) makeup.travelToVenue = travelToVenue;
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
    console.error("Update Makeup Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// DELETE MAKEUP PACKAGE
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
    console.error("Delete Makeup Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// GET ALL MAKEUP PACKAGES
// --------------------------------------------------------------------------


exports.getVendorsForMakeupModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({ success: false, message: "Invalid module ID" });
    }

    const vendorIds = await Makeup.distinct("provider", { module: moduleId });

    if (!vendorIds.length) {
      return res.json({
        success: true,
        message: "No vendors found for this module",
        data: []
      });
    }

    const vendors = await User.find({ _id: { $in: vendorIds } })
      .select("firstName lastName email phone")
      .populate("profile", "logo coverImage storeName");

    const final = vendors.map((v) => {
      const obj = v.toObject();

      // Set profilePhoto = coverImage
      if (obj.profile?.coverImage) {
        obj.profilePhoto = `${req.protocol}://${req.get("host")}${obj.profile.coverImage}`;
      } else {
        obj.profilePhoto = null;
      }

      return obj;
    });

    res.json({
      success: true,
      count: final.length,
      data: final
    });

  } catch (err) {
    console.error("Get Vendors Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

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
    console.error("Get All Makeups Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// GET MAKEUP BY ID
// --------------------------------------------------------------------------
exports.getMakeupPackageById = async (req, res) => {
  try {
    const makeup = await populateMakeup(req.params.id);
    if (!makeup) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: makeup });
  } catch (err) {
    console.error("Get Makeup Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// GET MAKEUP BY PROVIDER
// --------------------------------------------------------------------------
exports.getMakeupByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { moduleId } = req.query;

    let query = { provider: providerId };

    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      query.module = moduleId;
    }

    const makeups = await Makeup.find(query)
      .populate("module", "title")
      .populate("categories", "title image")
      .populate("provider", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: makeups.length,
      data: makeups
    });

  } catch (err) {
    console.error("Get Makeup By Provider Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// GET MAKEUP BY MODULE
// --------------------------------------------------------------------------
exports.getMakeupByModule = async (req, res) => {
  try {
    const makeups = await Makeup.find({ module: req.params.moduleId })
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
    console.error("Get Makeup By Module Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// TOGGLE TOP PICK STATUS
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
    console.error("Toggle Top Pick Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// GET TOP PICK MAKEUP PACKAGES
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
    console.error("Get Top Pick Makeups Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --------------------------------------------------------------------------
// TOGGLE ACTIVE/INACTIVE STATUS
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
    console.error("Toggle Active Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};