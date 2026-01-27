const Photography = require("../../models/vendor/PhotographyPackage");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Subscription = require("../../models/admin/Subscription");
const { enhanceProviderDetails } = require("../../utils/providerHelper");


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
const populatePhotography = async (id, req = null) => {
  let pkg = await Photography.findById(id)
    .populate("module")
    .populate("categories")
    .populate("provider", "firstName lastName email phone profilePhoto")
    .populate("createdBy", "firstName lastName email phone")
    .lean();

  if (!pkg) return null;

  if (pkg.provider) {
    pkg.provider = await enhanceProviderDetails(pkg.provider, req);
  }

  return pkg;
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
// GET SINGLE VENDOR OF A MODULE
// =======================================================================
exports.getSingleVendorForPhotographyModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { providerid } = req.query;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({ success: false, message: "Invalid module ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(providerid)) {
      return res.status(400).json({ success: false, message: "Invalid provider ID" });
    }

    const hasPackage = await Photography.exists({
      module: moduleId,
      provider: providerid
    });

    if (!hasPackage) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found for this module"
      });
    }

    const user = await User.findById(providerid)
      .select("firstName lastName email phone profilePhoto")
      .lean();

    const vendorProfile = await VendorProfile.findOne({ user: providerid })
      .select("storeName logo coverImage")
      .lean();

    const subscription = await Subscription.findOne({
      userId: providerid,
      isCurrent: true
    })
      .populate("planId")
      .populate("moduleId", "title icon")
      .lean();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const now = new Date();
    const isExpired = subscription ? subscription.endDate < now : true;
    const daysLeft = subscription
      ? Math.max(0, Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24)))
      : 0;

    res.json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto ? `${baseUrl}${user.profilePhoto}` : null,
        storeName: vendorProfile?.storeName || `${user.firstName} ${user.lastName}`,
        logo: vendorProfile?.logo ? `${baseUrl}${vendorProfile.logo}` : null,
        coverImage: vendorProfile?.coverImage ? `${baseUrl}${vendorProfile.coverImage}` : null,
        hasVendorProfile: !!vendorProfile,

        subscription: subscription
          ? {
            isSubscribed: subscription.status === "active",
            status: subscription.status,
            plan: subscription.planId,
            module: subscription.moduleId,
            billing: {
              startDate: subscription.startDate,
              endDate: subscription.endDate,
              paymentId: subscription.paymentId,
              autoRenew: subscription.autoRenew
            },
            access: {
              canAccess: subscription.status === "active" && !isExpired,
              isExpired,
              daysLeft
            }
          }
          : {
            isSubscribed: false,
            status: "none",
            plan: null,
            module: null,
            billing: null,
            access: {
              canAccess: false,
              isExpired: true,
              daysLeft: 0
            }
          }
      }
    });

  } catch (err) {
    console.error("Get Single Photography Vendor Error:", err);
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
// SEARCH PHOTOGRAPHY PACKAGES (Advanced Search)
// =======================================================================
exports.searchPhotographyPackages = async (req, res) => {
  try {
    const {
      keyword,
      moduleId,
      providerId,
      categoryId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    let query = { isActive: true };

    // Keyword search
    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword.trim(), "i");
      query.$or = [
        { packageTitle: regex },
        { description: regex },
        { includedServices: { $elemMatch: { $regex: regex } } }
      ];
    }

    // Module filter
    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      query.module = moduleId;
    }

    // Category filter
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.categories = categoryId;
    }

    // Provider filter
    if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
      query.provider = providerId;
    }

    // Price filter
    if (minPrice !== undefined) {
      query.price = { ...query.price, $gte: Number(minPrice) };
    }
    if (maxPrice !== undefined) {
      query.price = { ...query.price, $lte: Number(maxPrice) };
    }

    // Sorting
    const validSortFields = {
      price: "price",
      createdAt: "createdAt",
      title: "packageTitle"
    };

    const sortField = validSortFields[sortBy] || "createdAt";
    const order = sortOrder === "asc" ? 1 : -1;

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch data
    const packages = await Photography.find(query)
      .populate("module", "title")
      .populate("categories", "title image")
      .populate("provider", "firstName lastName email phone")
      .sort({ [sortField]: order })
      .skip(skip)
      .limit(Number(limit));

    const total = await Photography.countDocuments(query);

    res.json({
      success: true,
      count: packages.length,
      totalResults: total,
      totalPages: Math.ceil(total / limit),
      page: Number(page),
      data: packages
    });

  } catch (err) {
    console.error("Search Photography Error:", err);
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
    const providerId = req.query.providerid || req.query.providerId || null;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID"
      });
    }

    // 🔹 Build Photography query (THIS FIXES SINGLE VENDOR)
    let photoQuery = { module: moduleId };

    if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
      photoQuery.provider = providerId;
    }

    // 🔹 Get vendor IDs from Photography
    const vendorIds = await Photography.distinct("provider", photoQuery);

    if (!vendorIds.length) {
      return res.json({
        success: true,
        data: providerId ? null : []
      });
    }

    // 🔹 Get users
    const users = await User.find({ _id: { $in: vendorIds } })
      .select("firstName lastName email phone profilePhoto")
      .lean();

    // 🔹 Vendor profiles
    const vendorProfiles = await VendorProfile.find({
      user: { $in: vendorIds }
    })
      .select("user storeName logo coverImage")
      .lean();

    // 🔹 Subscriptions
    const subscriptions = await Subscription.find({
      userId: { $in: vendorIds },
      isCurrent: true
    })
      .populate("planId")
      .populate("moduleId", "title icon")
      .lean();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // 🔹 Map final response
    const final = users.map(user => {
      const vp = vendorProfiles.find(
        v => v.user.toString() === user._id.toString()
      );

      const sub = subscriptions.find(
        s => s.userId.toString() === user._id.toString()
      );

      const now = new Date();
      const isExpired = sub ? sub.endDate < now : true;
      const daysLeft = sub
        ? Math.max(
          0,
          Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24))
        )
        : 0;

      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto
          ? `${baseUrl}${user.profilePhoto}`
          : null,

        storeName: vp?.storeName || `${user.firstName} ${user.lastName}`,
        logo: vp?.logo ? `${baseUrl}${vp.logo}` : null,
        coverImage: vp?.coverImage ? `${baseUrl}${vp.coverImage}` : null,
        hasVendorProfile: !!vp,

        // 🔥 SUBSCRIPTION
        subscription: sub
          ? {
            isSubscribed: sub.status === "active",
            status: sub.status,
            plan: sub.planId,
            module: sub.moduleId,
            billing: {
              startDate: sub.startDate,
              endDate: sub.endDate,
              paymentId: sub.paymentId,
              autoRenew: sub.autoRenew
            },
            access: {
              canAccess: sub.status === "active" && !isExpired,
              isExpired,
              daysLeft
            }
          }
          : {
            isSubscribed: false,
            status: "none",
            plan: null,
            module: null,
            billing: null,
            access: {
              canAccess: false,
              isExpired: true,
              daysLeft: 0
            }
          }
      };
    });

    // ✅ SINGLE VENDOR RESPONSE
    if (providerId) {
      return res.json({
        success: true,
        data: final[0] || null
      });
    }

    // ✅ ALL VENDORS RESPONSE
    return res.json({
      success: true,
      count: final.length,
      data: final
    });

  } catch (err) {
    console.error("Get Photography Vendors Error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
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