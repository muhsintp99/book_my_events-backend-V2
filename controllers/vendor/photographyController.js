const Photography = require("../../models/vendor/PhotographyPackage");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// ---------------------- Helper: Parse JSON or array ----------------------
const parseField = (field) => {
  if (!field) return [];
  try {
    // If it's already an array (e.g., from multer fields) return it
    if (Array.isArray(field)) return field;
    // If it's a JSON string, parse it
    if (typeof field === "string") {
      const trimmed = field.trim();
      if (!trimmed) return [];
      return JSON.parse(trimmed);
    }
    // otherwise wrap value in array
    return [field];
  } catch (err) {
    // If JSON.parse fails, try to treat as comma separated string
    if (typeof field === "string") {
      return field.split(",").map(s => s.trim()).filter(Boolean);
    }
    return [];
  }
};

// ---------------------- Helper: Delete file ----------------------
const deleteFileIfExists = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.warn("Error deleting file:", filePath, err.message);
  }
};

// ---------------------- Helper: Populate Package ----------------------
const populatePhotography = async (id) => {
  return await Photography.findById(id)
    .populate("module")
    .populate("categories")
    .populate("provider", "firstName lastName email phone")
    .populate("createdBy", "firstName lastName email phone");
};

// =======================================================================
// CREATE PACKAGE
// =======================================================================
exports.createPhotographyPackage = async (req, res) => {
  try {
    const {
      module,
      categories,
      packageTitle,
      description,
      includedServices,
      basicAddons,  // NEW FIELD
      price,
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

    if (!price && price !== 0)
      return res.status(400).json({ success: false, message: "Price is required" });

    if (!module)
      return res.status(400).json({ success: false, message: "Module is required" });

    const photographyId = `PHP-${uuidv4()}`;

    const parsedCategories = parseField(categories);
    const parsedIncludes = parseField(includedServices);
    const parsedAddons = parseField(basicAddons);  // NEW

    const gallery = req.files?.gallery
      ? req.files.gallery.map((file) => `/uploads/photography/${file.filename}`)
      : [];

    const pkg = await Photography.create({
      photographyId,
      module,
      categories: parsedCategories,
      packageTitle,
      description,
      basicAddons: parsedAddons,  // NEW
      includedServices: parsedIncludes,
      price,
      travelToVenue: travelToVenue === "true" || travelToVenue === true,
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
    // If it's a Mongoose validation error, send 400 with details
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message).join(", ");
      return res.status(400).json({ success: false, message: messages || err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================================================================
// UPDATE PACKAGE
// =======================================================================
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
      includedServices,
      basicAddons,  // NEW FIELD
      price,
      travelToVenue,
      advanceBookingAmount,
      cancellationPolicy,
      updatedBy
    } = req.body;

    // categories and includedServices might be sent as JSON strings or arrays
    if (categories) pkg.categories = parseField(categories);
    if (includedServices) pkg.includedServices = parseField(includedServices);
    if (basicAddons !== undefined) pkg.basicAddons = parseField(basicAddons);  // NEW

    if (req.files?.gallery) {
      // delete old images from disk (if stored locally)
      pkg.gallery.forEach((img) => {
        // img is like /uploads/photography/filename.jpg
        deleteFileIfExists(path.join(__dirname, `../../${img}`));
      });
      pkg.gallery = req.files.gallery.map((file) => `/uploads/photography/${file.filename}`);
    }

    if (packageTitle) pkg.packageTitle = packageTitle.trim();
    if (description) pkg.description = description;
    if (module) pkg.module = module;
    if (price !== undefined) pkg.price = price;

    if (travelToVenue !== undefined) pkg.travelToVenue = travelToVenue === "true" || travelToVenue === true;
    if (advanceBookingAmount !== undefined) pkg.advanceBookingAmount = advanceBookingAmount;
    if (cancellationPolicy !== undefined) pkg.cancellationPolicy = cancellationPolicy;

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
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map(e => e.message).join(", ");
      return res.status(400).json({ success: false, message: messages || err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================================================================
// DELETE PACKAGE
// =======================================================================
exports.deletePhotographyPackage = async (req, res) => {
  try {
    const pkg = await Photography.findById(req.params.id);
    if (!pkg)
      return res.status(404).json({ success: false, message: "Photography package not found" });

    pkg.gallery.forEach((img) =>
      deleteFileIfExists(path.join(__dirname, `../../${img}`))
    );

    await pkg.deleteOne();

    res.json({ success: true, message: "Photography package deleted successfully" });

  } catch (err) {
    console.error("Delete Photography Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================================================================
// VENDOR LIST BY MODULE
// =======================================================================
exports.getVendorsForPhotographyModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({ success: false, message: "Invalid module ID" });
    }

    const vendorIds = await Photography.distinct("provider", { module: moduleId });

    if (!vendorIds.length) {
      return res.json({
        success: true,
        message: "No vendors found for this module",
        data: []
      });
    }

    const vendors = await User.find({ _id: { $in: vendorIds } })
      .select("firstName lastName email phone profilePhoto")
      .populate("profile", "profilePhoto name mobileNumber");

    const vendorProfiles = await VendorProfile.find({ user: { $in: vendorIds } })
      .select("user logo coverImage storeName")
      .lean();

    const map = {};
    vendorProfiles.forEach((vp) => {
      map[vp.user.toString()] = vp;
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const final = vendors.map((v) => {
      const obj = v.toObject();
      const vp = map[obj._id.toString()];

      // Priority: logo > coverImage > profile.profilePhoto > user.profilePhoto
      if (vp?.logo) {
        obj.profilePhoto = `${baseUrl}${vp.logo}`;
      } else if (vp?.coverImage) {
        obj.profilePhoto = `${baseUrl}${vp.coverImage}`;
      } else if (obj.profile?.profilePhoto) {
        obj.profilePhoto = `${baseUrl}${obj.profile.profilePhoto}`;
      } else if (obj.profilePhoto) {
        obj.profilePhoto = `${baseUrl}${obj.profilePhoto}`;
      }

      obj.storeName = vp?.storeName || `${obj.firstName} ${obj.lastName}`;
      obj.logo = vp?.logo ? `${baseUrl}${vp.logo}` : null;
      obj.coverImage = vp?.coverImage ? `${baseUrl}${vp.coverImage}` : null;

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

// =======================================================================
// GET PACKAGES BY PROVIDER
// =======================================================================
exports.getPhotographyByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { moduleId } = req.query;

    let query = { provider: providerId };

    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      query.module = moduleId;
    }

    const pkgs = await Photography.find(query)
      .populate("module")
      .populate("categories")
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

// =======================================================================
// GET ALL PACKAGES
// =======================================================================
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

// =======================================================================
// GET SINGLE PACKAGE
// =======================================================================
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

// =======================================================================
// TOGGLE TOP PICK
// =======================================================================
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

// =======================================================================
// GET TOP PICKS
// =======================================================================
exports.getTopPickPhotographies = async (req, res) => {
  try {
    const pkgs = await Photography.find({ isTopPick: true, isActive: true })
      .populate("module")
      .populate("categories")
      .populate("provider", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pkgs.length,
      data: pkgs
    });

  } catch (err) {
    console.error("Get Top Pick Photographies Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================================================================
// TOGGLE ACTIVE STATUS
// =======================================================================
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