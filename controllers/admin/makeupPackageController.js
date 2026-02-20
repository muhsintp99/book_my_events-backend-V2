const Makeup = require("../../models/admin/makeupPackageModel");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("../../models/vendor/Profile");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const Subscription = require("../../models/admin/Subscription");



// ---------------------- Helper: Parse JSON or Array ----------------------
const parseField = (field) => {
  if (!field) return [];
  try {
    return Array.isArray(field) ? field : JSON.parse(field);
  } catch {
    return [];
  }
};

// ---------------------- Helper: Parse Object ----------------------
const parseObject = (field) => {
  if (!field) return {};
  try {
    return typeof field === "object" ? field : JSON.parse(field);
  } catch {
    return {};
  }
};

// ---------------------- Helper: Delete File ----------------------
const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// ---------------------- Helper: Populate Makeup ----------------------
const populateMakeup = async (id, req = null) => {
  const baseUrl = req
    ? `${req.protocol}://${req.get("host")}`
    : "http://api.bookmyevent.ae";

  let makeup = await Makeup.findById(id)
    .populate("module", "-__v")
    .populate("categories", "-__v")
    .populate("provider", "firstName lastName email phone profilePhoto")
    .lean();

  // If makeup NOT found → return null
  if (!makeup) return null;

  // ❗ PROTECT when provider is missing
  if (!makeup.provider) {
    makeup.provider = {
      _id: null,
      firstName: null,
      lastName: null,
      email: null,
      phone: null,
      profilePhoto: null,
      storeName: null,
      logo: null,
      coverImage: null,
      hasVendorProfile: false
    };
    return makeup;
  }

  // Fetch VendorProfile linked to provider
  const vendorProfile = await VendorProfile.findOne({ user: makeup.provider._id })
    .select("storeName logo coverImage")
    .lean();

  if (vendorProfile) {
    makeup.provider.storeName = vendorProfile.storeName;
    makeup.provider.logo = vendorProfile.logo ? baseUrl + vendorProfile.logo : null;
    makeup.provider.coverImage = vendorProfile.coverImage ? baseUrl + vendorProfile.coverImage : null;
    makeup.provider.hasVendorProfile = true;
  } else {
    makeup.provider.storeName =
      `${makeup.provider.firstName || ""} ${makeup.provider.lastName || ""}`.trim();
    makeup.provider.logo = makeup.provider.profilePhoto || null;
    makeup.provider.coverImage = null;
    makeup.provider.hasVendorProfile = false;
  }

  return makeup;
};




// ==========================================================================
// CREATE MAKEUP PACKAGE
// ==========================================================================
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
      basicAddOns,
      createdBy
    } = req.body;


    if (!packageTitle)
      return res.status(400).json({ success: false, message: "Package title is required" });

    if (!providerId)
      return res.status(400).json({ success: false, message: "Provider ID is required" });


    const makeupId = `MUP-${uuidv4()}`;

    const parsedCategories = parseField(categories);
    const parsedIncludes = parseField(includedServices);
    const parsedBasicAddOns = parseObject(basicAddOns);


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

      // ⭐⭐ STORE BASIC ADD ONS ⭐⭐
      basicAddOns: parsedBasicAddOns,

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

// ==========================================================
// SEARCH MAKEUP PACKAGES
// ==========================================================
exports.searchMakeupPackages = async (req, res) => {
  try {
    const {
      keyword,
      moduleId,
      categoryId,
      providerId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = { isActive: true };

    // Keyword search
    if (keyword && keyword.trim()) {
      const regex = new RegExp(keyword.trim(), "i");
      query.$or = [
        { packageTitle: regex },
        { description: regex },
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

    // Price filtering
    if (minPrice !== undefined) {
      query.finalPrice = { ...query.finalPrice, $gte: Number(minPrice) };
    }
    if (maxPrice !== undefined) {
      query.finalPrice = { ...query.finalPrice, $lte: Number(maxPrice) };
    }

    // Sorting field
    const validSortFields = {
      price: "finalPrice",
      createdAt: "createdAt",
      title: "packageTitle",
    };

    const sortField = validSortFields[sortBy] || "createdAt";
    const order = sortOrder === "asc" ? 1 : -1;

    // Pagination
    const skip = (page - 1) * limit;

    // Query execution
    const makeupPackages = await Makeup.find(query)
      .populate("module", "title images")
      .populate("categories", "title image")
      .populate("provider", "firstName lastName email phone")
      .sort({ [sortField]: order })
      .skip(skip)
      .limit(Number(limit));

    const total = await Makeup.countDocuments(query);

    res.json({
      success: true,
      count: makeupPackages.length,
      totalResults: total,
      totalPages: Math.ceil(total / limit),
      page: Number(page),
      data: makeupPackages,
    });

  } catch (err) {
    console.error("Search Makeup Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ==========================================================================
// UPDATE MAKEUP PACKAGE
// ==========================================================================
exports.updateMakeupPackage = async (req, res) => {
  try {
    const makeup = await Makeup.findById(req.params.id);
    if (!makeup)
      return res.status(404).json({ success: false, message: "Makeup package not found" });

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
      basicAddOns,
      updatedBy
    } = req.body;

    if (categories) makeup.categories = parseField(categories);
    if (includedServices) makeup.includedServices = parseField(includedServices);

    // ⭐⭐ UPDATE BASIC ADD ONS ⭐⭐
    if (basicAddOns) makeup.basicAddOns = parseObject(basicAddOns);


    // Replace gallery if new one uploaded
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



// ==========================================================================
// DELETE MAKEUP PACKAGE
// ==========================================================================
exports.deleteMakeupPackage = async (req, res) => {
  try {
    const makeup = await Makeup.findById(req.params.id);
    if (!makeup)
      return res.status(404).json({ success: false, message: "Makeup package not found" });

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


// exports.getVendorsForMakeupModule = async (req, res) => {
//   try {
//     const { moduleId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(moduleId)) {
//       return res.status(400).json({ success: false, message: "Invalid module ID" });
//     }

//     const vendorIds = await Makeup.distinct("provider", { module: moduleId });

//     if (!vendorIds.length) {
//       return res.json({
//         success: true,
//         message: "No vendors found for this module",
//         data: []
//       });
//     }

//         // Populate vendors + their profile (logo / profilePhoto)
//     const vendors = await User.find({ _id: { $in: vendorIds } })
//       .select("firstName lastName email phone profilePhoto")
//       .populate("profile", "profilePhoto name mobileNumber");

//     // ⭐⭐ THIS IS WHERE YOU ADD THE CODE ⭐⭐
//     const final = vendors.map(v => {
//       const obj = v.toObject();

//       // Set profilePhoto = coverImage
//       if (obj.profile?.coverImage) {
//         obj.profilePhoto = `${req.protocol}://${req.get("host")}${obj.profile.coverImage}`;
//       } else {
//         obj.profilePhoto = null;
//       }

//       return obj;
//     });

//     res.json({
//       success: true,
//       count: final.length,
//       data: final
//     });

//   } catch (err) {
//     console.error("Get Vendors Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
exports.getVendorsForMakeupModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const providerId = req.query.providerId || req.query.providerid || null;
    const zoneId = req.query.zoneId || req.query.zoneid || null;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({ success: false, message: "Invalid module ID" });
    }

    let query = { module: moduleId };
    if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
      query.user = providerId;
    }

    if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
      query.zone = zoneId;
    }

    const vendorProfiles = await VendorProfile.find(query)
      .select("user storeName logo coverImage subscriptionStatus isFreeTrial zone")
      .lean();

    if (!vendorProfiles.length) {
      return res.json({
        success: true,
        data: providerId ? null : []
      });
    }

    const vendorIds = vendorProfiles.map(v => v.user);

    // ✅ COUNT PACKAGES PER VENDOR using aggregation
    const packageCounts = await Makeup.aggregate([
      {
        $match: {
          module: new mongoose.Types.ObjectId(moduleId),
          provider: { $in: vendorIds }
        }
      },
      {
        $group: {
          _id: "$provider",
          count: { $sum: 1 }
        }
      }
    ]);

    const users = await User.find({ _id: { $in: vendorIds } })
      .select("firstName lastName email phone profilePhoto")
      .lean();

    const subscriptions = await Subscription.find({
      userId: { $in: vendorIds },
      isCurrent: true
    })
      .populate("planId")
      .populate("moduleId", "title icon")
      .lean();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const final = users.map(u => {
      const vp = vendorProfiles.find(v => v.user.toString() === u._id.toString());
      const sub = subscriptions.find(s => s.userId.toString() === u._id.toString());

      // ✅ GET PACKAGE COUNT FOR THIS VENDOR
      const pkgCount = packageCounts.find(p => p._id.toString() === u._id.toString());
      const packageCount = pkgCount ? pkgCount.count : 0;

      const now = new Date();
      const isExpired = sub ? sub.endDate < now : true;
      const daysLeft = sub
        ? Math.max(0, Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24)))
        : 0;

      return {
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phone: u.phone,
        profilePhoto: u.profilePhoto ? `${baseUrl}${u.profilePhoto}` : null,
        storeName: vp?.storeName || `${u.firstName} ${u.lastName}`,
        logo: vp?.logo ? `${baseUrl}${vp.logo}` : null,
        coverImage: vp?.coverImage ? `${baseUrl}${vp.coverImage}` : null,
        hasVendorProfile: true,
        zone: vp?.zone || null,
        packageCount, // ✅ ADD PACKAGE COUNT TO RESPONSE
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

    // ✅ SINGLE VENDOR (don't filter for single vendor query)
    if (providerId) {
      return res.json({ success: true, data: final[0] || null });
    }

    // ✅ FILTER OUT VENDORS WITH ZERO PACKAGES
    const filtered = final.filter(v => v.packageCount > 0);

    // ✅ ALL VENDORS (only those with packages)
    return res.json({
      success: true,
      count: filtered.length,
      data: filtered
    });

  } catch (err) {
    console.error("Get Vendors Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};



// ✅ FIXED VERSION - Query VendorProfile directly by module
// ✅ FIXED VERSION - Query VendorProfile directly by module
// exports.getVendorsForMakeupModule = async (req, res) => {
//   try {
//     const { moduleId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(moduleId)) {
//       return res.status(400).json({ success: false, message: "Invalid module ID" });
//     }

//     // 1️⃣ Vendor profiles
//     const vendorProfiles = await VendorProfile.find({ module: moduleId })
//       .select("user storeName logo coverImage")
//       .lean();

//     if (!vendorProfiles.length) {
//       return res.json({ success: true, data: [] });
//     }

//     const vendorIds = vendorProfiles.map(v => v.user);

//     // 2️⃣ Users
//     const users = await User.find({ _id: { $in: vendorIds } })
//       .select("firstName lastName email phone profilePhoto")
//       .lean();

//     // 3️⃣ 🔥 Subscriptions
//     const subscriptions = await Subscription.find({
//       userId: { $in: vendorIds },
//       isCurrent: true
//     })
//       .populate("planId")
//       .populate("moduleId", "title icon")
//       .lean();

//     const baseUrl = `${req.protocol}://${req.get("host")}`;

//     const final = users.map(user => {
//       const vp = vendorProfiles.find(v => v.user.toString() === user._id.toString());
//       const sub = subscriptions.find(s => s.userId.toString() === user._id.toString());

//       const now = new Date();
//       const isExpired = sub ? sub.endDate < now : true;
//       const daysLeft = sub
//         ? Math.max(0, Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24)))
//         : 0;

//       return {
//         _id: user._id,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         phone: user.phone,
//         profilePhoto: user.profilePhoto
//           ? `${baseUrl}${user.profilePhoto}`
//           : null,

//         storeName: vp?.storeName || `${user.firstName} ${user.lastName}`,
//         logo: vp?.logo ? `${baseUrl}${vp.logo}` : null,
//         coverImage: vp?.coverImage ? `${baseUrl}${vp.coverImage}` : null,
//         hasVendorProfile: true,

//         // ✅ SUBSCRIPTION BLOCK (THIS WAS MISSING)
//         subscription: sub
//           ? {
//               isSubscribed: sub.status === "active",
//               status: sub.status,
//               plan: sub.planId,
//               module: sub.moduleId,
//               billing: {
//                 startDate: sub.startDate,
//                 endDate: sub.endDate,
//                 paymentId: sub.paymentId,
//                 autoRenew: sub.autoRenew
//               },
//               access: {
//                 canAccess: sub.status === "active" && !isExpired,
//                 isExpired,
//                 daysLeft
//               }
//             }
//           : {
//               isSubscribed: false,
//               status: "none",
//               plan: null,
//               module: null,
//               billing: null,
//               access: {
//                 canAccess: false,
//                 isExpired: true,
//                 daysLeft: 0
//               }
//             }
//       };
//     });

//     res.json({
//       success: true,
//       count: final.length,
//       data: final
//     });

//   } catch (err) {
//     console.error("Get Vendors Error:", err);
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.listMakeupVendors = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const vendors = await VendorProfile.find({ module: moduleId })
      .populate({
        path: "user",
        select: "firstName lastName email phone role"
      })
      .select("storeName logo coverImage module user");

    const formatted = vendors.map(v => ({
      _id: v.user?._id,
      firstName: v.user?.firstName,
      lastName: v.user?.lastName,
      email: v.user?.email,
      phone: v.user?.phone,
      storeName: v.storeName,
      logo: v.logo ? `http://localhost:5000${v.logo}` : null,
      coverImage: v.coverImage ? `http://localhost:5000${v.coverImage}` : null,
      vendorProfileId: v._id,
      module: v.module
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });

  } catch (err) {
    console.error("Makeup Vendor List Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch makeup vendors",
      error: err.message
    });
  }
};
exports.getAllMakeupPackages = async (req, res) => {
  try {
    const { search, module } = req.query;

    let query = {};

    if (search && search.trim()) query.$text = { $search: search };
    if (module && mongoose.Types.ObjectId.isValid(module)) query.module = module;

    const makeups = await Makeup.find(query)
      .sort({ isTopPick: -1, createdAt: -1 });

    const final = await Promise.all(
      makeups.map(m => populateMakeup(m._id, req))
    );

    res.json({
      success: true,
      count: final.length,
      data: final
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
      .sort({ createdAt: -1 });

    const final = await Promise.all(
      makeups.map(m => populateMakeup(m._id, req))
    );

    res.json({
      success: true,
      count: final.length,
      data: final
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