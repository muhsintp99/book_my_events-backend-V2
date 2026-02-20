// const fs = require('fs');
// const path = require('path');
// const { v4: uuidv4 } = require('uuid');
// const Catering = require('../../models/vendor/Catering');
// const Venue = require('../../models/vendor/Venue');

// // 🧹 Helper: Delete file if exists
// const deleteFileIfExists = (filePath) => {
//   if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
// };

// // 🧩 Helper: Populate catering data
// const populateCatering = async (cateringId) => {
//   return await Catering.findById(cateringId)
//     .populate('module', '-__v')
//     .populate('categories', '-__v');
// };

// // ✅ Create Catering
// exports.createCatering = async (req, res) => {
//   try {
//     const {
//       module,
//       categories,
//       title,
//       subtitle,
//       description,
//       cateringType,
//       includes,
//       price,
//       createdBy,
//       cateringId,
//       providerId,
//     } = req.body;

//     if (!title?.trim()) return res.status(400).json({ error: 'Catering title is required' });
//     if (!providerId) return res.status(400).json({ error: 'Provider ID is required' });
//     if (price === undefined || isNaN(price)) return res.status(400).json({ error: 'Valid price is required' });

//     // Ensure unique catering ID
//     let finalCateringId = cateringId || `CAT-${uuidv4()}`;
//     if (cateringId && await Catering.findOne({ cateringId })) {
//       return res.status(400).json({ error: `Catering with ID ${cateringId} already exists` });
//     }

//     // Parse includes (either JSON or array)
//     let parsedIncludes = [];
//     if (includes) {
//       try {
//         parsedIncludes = typeof includes === 'string' ? JSON.parse(includes) : includes;
//       } catch {
//         parsedIncludes = [];
//       }
//     }

//     // Parse categories
//     let parsedCategories = [];
//     if (categories) {
//       try {
//         parsedCategories = typeof categories === 'string' ? JSON.parse(categories) : categories;
//       } catch {
//         parsedCategories = [];
//       }
//     }

//     // ✅ FIX: Handle uploaded files with correct path (capital U to match server.js)
//     const images = req.files?.images
//       ? req.files.images.map((file) => `Uploads/catering/${file.filename}`)
//       : [];

//     const thumbnail = req.files?.thumbnail
//       ? `Uploads/catering/${req.files.thumbnail[0].filename}`
//       : null;

//     const cateringData = {
//       cateringId: finalCateringId,
//       module: module || null,
//       categories: parsedCategories,
//       title: title.trim(),
//       subtitle: subtitle || '',
//       description: description || '',
//       cateringType: cateringType || 'basic',
//       includes: parsedIncludes,
//       price: parseFloat(price),
//       images,
//       thumbnail,
//       createdBy: createdBy || null,
//       provider: providerId,
//     };

//     const newCatering = await Catering.create(cateringData);
//     const populated = await populateCatering(newCatering._id);

//     res.status(201).json({
//       message: 'Catering created successfully',
//       catering: populated,
//     });
//   } catch (err) {
//     console.error('❌ Create Catering Error:', err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Update Catering
// exports.updateCatering = async (req, res) => {
//   try {
//     const catering = await Catering.findById(req.params.id);
//     if (!catering) return res.status(404).json({ error: 'Catering not found' });

//     const {
//       module,
//       categories,
//       title,
//       subtitle,
//       description,
//       cateringType,
//       includes,
//       price,
//       updatedBy,
//       cateringId,
//     } = req.body;

//     // Unique catering ID validation
//     if (cateringId && cateringId !== catering.cateringId) {
//       if (await Catering.findOne({ cateringId })) {
//         return res.status(400).json({ error: `Catering with ID ${cateringId} already exists` });
//       }
//       catering.cateringId = cateringId;
//     }

//     // ✅ FIX: Handle new images with correct path
//     if (req.files?.images) {
//       catering.images.forEach((imgPath) => deleteFileIfExists(path.join(__dirname, `../../${imgPath}`)));
//       catering.images = req.files.images.map((file) => `Uploads/catering/${file.filename}`);
//     }

//     // ✅ FIX: Handle new thumbnail with correct path
//     if (req.files?.thumbnail) {
//       deleteFileIfExists(path.join(__dirname, `../../${catering.thumbnail}`));
//       catering.thumbnail = `Uploads/catering/${req.files.thumbnail[0].filename}`;
//     }

//     // Parse categories & includes
//     if (categories) {
//       try {
//         catering.categories = typeof categories === 'string' ? JSON.parse(categories) : categories;
//       } catch {
//         catering.categories = [];
//       }
//     }

//     if (includes) {
//       try {
//         catering.includes = typeof includes === 'string' ? JSON.parse(includes) : includes;
//       } catch {
//         catering.includes = [];
//       }
//     }

//     // Update other fields
//     if (module) catering.module = module;
//     if (title) catering.title = title.trim();
//     if (subtitle) catering.subtitle = subtitle;
//     if (description) catering.description = description;
//     if (cateringType) catering.cateringType = cateringType;
//     if (price !== undefined && !isNaN(price)) catering.price = parseFloat(price);
//     if (updatedBy) catering.updatedBy = updatedBy;

//     await catering.save();
//     const populated = await populateCatering(catering._id);

//     res.json({ message: 'Catering updated successfully', catering: populated });
//   } catch (err) {
//     console.error('❌ Update Catering Error:', err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Delete Catering
// exports.deleteCatering = async (req, res) => {
//   try {
//     const catering = await Catering.findById(req.params.id);
//     if (!catering) return res.status(404).json({ error: 'Catering not found' });

//     catering.images.forEach((imgPath) => deleteFileIfExists(path.join(__dirname, `../../${imgPath}`)));
//     deleteFileIfExists(path.join(__dirname, `../../${catering.thumbnail}`));

//     await catering.deleteOne();
//     res.json({ message: 'Catering deleted successfully' });
//   } catch (err) {
//     console.error('❌ Delete Catering Error:', err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Get All Caterings
// exports.getCaterings = async (req, res) => {
//   try {
//     const caterings = await Catering.find()
//       .populate('module', '-__v')
//       .populate('categories', '-__v');
//     res.json(caterings);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Get Caterings by Provider
// exports.getCateringsByProvider = async (req, res) => {
//   try {
//     const { providerId } = req.params;
//     if (!providerId) return res.status(400).json({ error: 'Provider ID is required' });

//     let caterings = await Catering.find({
//       $or: [{ provider: providerId }, { createdBy: providerId }]
//     })
//       .populate('module', 'title images isActive')
//       .populate('categories', 'title')
//       .sort({ createdAt: -1 });

//     if (!caterings.length) {
//       const venues = await Venue.find({
//         $or: [{ provider: providerId }, { createdBy: providerId }]
//       }).populate({
//         path: 'caterings',
//         populate: [
//           { path: 'module', select: 'title images isActive' },
//           { path: 'categories', select: 'title' }
//         ]
//       });

//       const cateringMap = new Map();
//       venues.forEach(v => v.caterings?.forEach(cat => {
//         if (cat && cat._id) cateringMap.set(cat._id.toString(), cat);
//       }));

//       caterings = Array.from(cateringMap.values());
//     }

//     if (!caterings.length) {
//       return res.status(404).json({ message: 'No caterings found for this provider' });
//     }

//     res.json({ message: 'Caterings fetched successfully', count: caterings.length, caterings });
//   } catch (err) {
//     console.error('❌ Get Caterings by Provider Error:', err);
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Get Single Catering
// exports.getCatering = async (req, res) => {
//   try {
//     const catering = await Catering.findById(req.params.id)
//       .populate('module', '-__v')
//       .populate('categories', '-__v');
//     if (!catering) return res.status(404).json({ error: 'Catering not found' });
//     res.json(catering);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Get Caterings by Module
// exports.getCateringsByModule = async (req, res) => {
//   try {
//     const { moduleId } = req.params;
//     if (!moduleId) return res.status(400).json({ error: 'Module ID is required' });

//     const caterings = await Catering.find({ module: moduleId })
//       .populate('module', 'title images isActive')
//       .populate('categories', 'title')
//       .sort({ createdAt: -1 });

//     if (!caterings.length)
//       return res.status(404).json({ message: 'No caterings found for this module' });

//     res.json({ message: 'Caterings fetched successfully', caterings });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// // ✅ Block / Reactivate
// exports.blockCatering = async (req, res) => {
//   try {
//     const catering = await Catering.findByIdAndUpdate(
//       req.params.id,
//       { isActive: false, updatedBy: req.body.updatedBy || null },
//       { new: true }
//     );
//     if (!catering) return res.status(404).json({ error: 'Catering not found' });
//     res.json({ message: 'Catering blocked successfully', catering });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// exports.reactivateCatering = async (req, res) => {
//   try {
//     const catering = await Catering.findByIdAndUpdate(
//       req.params.id,
//       { isActive: true, updatedBy: req.body.updatedBy || null },
//       { new: true }
//     );
//     if (!catering) return res.status(404).json({ error: 'Catering not found' });
//     res.json({ message: 'Catering reactivated successfully', catering });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const Catering = require("../../models/vendor/Catering");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const { enhanceProviderDetails } = require("../../utils/providerHelper");

// ----------------------------- Helpers -----------------------------
const deleteFileIfExists = (filePath) => {
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

const populateCatering = async (id, req = null) => {
  let cater = await Catering.findById(id)
    .populate("module", "title images")
    .populate("categories", "title image")
    .populate("provider", "firstName lastName email phone profilePhoto")
    .populate("createdBy", "firstName lastName email phone")
    .lean();

  if (!cater) return null;

  if (cater.provider) {
    cater.provider = await enhanceProviderDetails(cater.provider, req);
  }

  return cater;
};

// ----------------------------- CREATE -----------------------------
exports.createCatering = async (req, res) => {
  try {
    const {
      module,
      categories,
      title,
      subtitle,
      description,
      cateringType,
      includes,
      price,
      advanceBookingAmount,
      createdBy,
      providerId
    } = req.body;

    if (!title)
      return res.status(400).json({ success: false, error: "Title is required" });

    if (!providerId)
      return res.status(400).json({ success: false, error: "Provider ID is required" });

    const cateringId = `CAT-${uuidv4()}`;

    let parsedIncludes = [];
    let parsedCategories = [];

    // Parse JSON safely
    try { parsedIncludes = JSON.parse(includes || "[]"); } catch { }
    try { parsedCategories = JSON.parse(categories || "[]"); } catch { }

    const images = req.files?.images
      ? req.files.images.map((file) => `/uploads/catering/${file.filename}`)
      : [];

    const thumbnail = req.files?.thumbnail
      ? `/uploads/catering/${req.files.thumbnail[0].filename}`
      : null;

    const cater = await Catering.create({
      cateringId,
      module,
      categories: parsedCategories,
      title,
      subtitle,
      description,
      cateringType,
      includes: parsedIncludes,
      price,
      advanceBookingAmount: Number(advanceBookingAmount) || 0,

      images,
      thumbnail,
      createdBy,
      provider: providerId,
    });

    const populated = await populateCatering(cater._id);

    res.status(201).json({
      success: true,
      message: "Catering package created successfully",
      data: populated
    });

  } catch (err) {
    console.log("❌ Create Catering Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ----------------------------- UPDATE -----------------------------
exports.updateCatering = async (req, res) => {
  try {
    const catering = await Catering.findById(req.params.id);
    if (!catering)
      return res.status(404).json({ success: false, error: "Catering not found" });

    const {
      module,
      categories,
      title,
      subtitle,
      description,
      cateringType,
      includes,
      price,
      advanceBookingAmount, // ✅ ADD THIS

      updatedBy
    } = req.body;

    // New image upload
    if (req.files?.images) {
      catering.images.forEach((img) =>
        deleteFileIfExists(path.join(__dirname, `../../${img}`))
      );
      catering.images = req.files.images.map(
        (file) => `/uploads/catering/${file.filename}`
      );
    }

    if (req.files?.thumbnail) {
      deleteFileIfExists(path.join(__dirname, `../../${catering.thumbnail}`));
      catering.thumbnail = `/uploads/catering/${req.files.thumbnail[0].filename}`;
    }

    // Update fields
    if (categories)
      catering.categories = JSON.parse(categories);

    if (includes)
      catering.includes = JSON.parse(includes);

    catering.module = module || catering.module;
    catering.title = title || catering.title;
    catering.subtitle = subtitle || catering.subtitle;
    catering.description = description || catering.description;
    catering.cateringType = cateringType || catering.cateringType;
    catering.price = price || catering.price;
    catering.updatedBy = updatedBy;
    if (advanceBookingAmount !== undefined) {
      catering.advanceBookingAmount = Number(advanceBookingAmount);
    }

    await catering.save();

    const populated = await populateCatering(catering._id);

    res.json({ success: true, message: "Catering updated", data: populated });

  } catch (err) {
    console.log("❌ Update Catering Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ----------------------------- DELETE -----------------------------
exports.deleteCatering = async (req, res) => {
  try {
    const catering = await Catering.findById(req.params.id);
    if (!catering)
      return res.status(404).json({ success: false, error: "Not found" });

    catering.images.forEach((img) =>
      deleteFileIfExists(path.join(__dirname, `../../${img}`))
    );
    deleteFileIfExists(path.join(__dirname, `../../${catering.thumbnail}`));

    await catering.deleteOne();

    res.json({ success: true, message: "Catering deleted successfully" });

  } catch (err) {
    console.log("❌ Delete Catering Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ----------------------------- GET ALL -----------------------------
exports.getCaterings = async (req, res) => {
  try {
    const caterings = await Catering.find()
      .populate("module", "title images")
      .populate("categories", "title image")
      .populate("provider", "firstName lastName email phone")
      .sort({ isTopPick: -1, createdAt: -1 });

    res.json({ success: true, count: caterings.length, data: caterings });

  } catch (err) {
    console.log("❌ Get Catering Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ----------------------------- GET SINGLE -----------------------------
exports.getCatering = async (req, res) => {
  try {
    const catering = await populateCatering(req.params.id);
    if (!catering)
      return res.status(404).json({ success: false, error: "Not found" });

    res.json({ success: true, data: catering });

  } catch (err) {
    console.log("❌ Get Single Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ----------------------------- LIST VENDORS FOR MODULE -----------------------------
// exports.getVendorsForCateringModule = async (req, res) => {
//   try {
//     const { moduleId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(moduleId)) {
//       return res.status(400).json({ success: false, message: "Invalid module ID" });
//     }

//     // 🔥 1. Fetch all VendorProfiles assigned to this module
//     const vendorProfiles = await VendorProfile.find({ module: moduleId })
//       .select("storeName logo coverImage module user")
//       .populate("user", "firstName lastName email phone role isActive")
//       .lean();

//     if (!vendorProfiles.length) {
//       return res.json({
//         success: true,
//         message: "No vendors registered for this module",
//         data: []
//       });
//     }

//     // 🔥 2. Format response
//     const base = `${req.protocol}://${req.get("host")}`;

//     const formatted = vendorProfiles.map(vp => {
//       const u = vp.user;

//       return {
//         vendorId: u?._id,
//         firstName: u?.firstName,
//         lastName: u?.lastName,
//         email: u?.email,
//         phone: u?.phone,

//         storeName: vp.storeName,
//         logo: vp.logo ? `${base}${vp.logo}` : null,
//         coverImage: vp.coverImage ? `${base}${vp.coverImage}` : null,

//         hasPackages: false   // We can override this later if needed
//       };
//     });

//     res.json({
//       success: true,
//       count: formatted.length,
//       data: formatted
//     });

//   } catch (err) {
//     console.error("❌ Vendor List Error:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// ----------------------------- GET VENDORS FOR CATERING MODULE (SINGLE + ALL) -----------------------------
exports.getVendorsForCateringModule = async (req, res) => {
  try {
    const { moduleId } = req.params;

    // ✅ Support both providerId & providerid, and zoneId
    const providerId = req.query.providerId || req.query.providerid || null;
    const zoneId = req.query.zoneId || req.query.zoneid || null;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid module ID"
      });
    }

    // 🔹 Base query
    let query = { module: moduleId };

    // 🔹 If providerId passed → fetch only that vendor
    if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
      query.user = providerId;
    }

    // ✅ Add zone filtering
    if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
      query.zone = zoneId;
    }

    // 🔥 Fetch VendorProfiles
    const vendorProfiles = await VendorProfile.find(query)
      .select("user storeName logo coverImage zone")
      .lean();

    if (!vendorProfiles.length) {
      return res.json({
        success: true,
        data: providerId ? null : [],
        message: "Vendor not found for this module"
      });
    }

    const vendorIds = vendorProfiles.map(vp => vp.user);

    // ✅ COUNT CATERING PACKAGES PER VENDOR using aggregation
    const cateringCounts = await Catering.aggregate([
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

    // 🔥 Fetch Users
    const users = await User.find({ _id: { $in: vendorIds } })
      .select("firstName lastName email phone profilePhoto")
      .lean();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // 🔥 Merge User + VendorProfile + Package Count
    const final = await Promise.all(
      users.map(async (u) => {
        const enhanced = await enhanceProviderDetails(u, req);

        // ✅ GET CATERING COUNT FOR THIS VENDOR
        const cateringCount = cateringCounts.find(c => c._id.toString() === u._id.toString());
        enhanced.packageCount = cateringCount ? cateringCount.count : 0;

        return enhanced;
      })
    );

    // ⭐ If providerId → return SINGLE vendor (don't filter)
    if (providerId) {
      return res.json({
        success: true,
        data: final[0] || null
      });
    }

    // ✅ FILTER OUT VENDORS WITH ZERO PACKAGES
    const filtered = final.filter(v => v.packageCount > 0);

    // ⭐ Else → return ALL vendors (only those with packages)
    return res.json({
      success: true,
      count: filtered.length,
      data: filtered
    });

  } catch (err) {
    console.error("❌ Get Catering Vendors Error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// ----------------------------- GET PACKAGES BY PROVIDER -----------------------------
exports.getCateringsByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { moduleId } = req.query;

    const query = { provider: providerId };
    if (moduleId) query.module = moduleId;

    const caterings = await Catering.find(query)
      .populate("module", "title")
      .populate("categories", "title image")
      .populate("provider", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: caterings.length, data: caterings });

  } catch (err) {
    console.log("❌ Get Provider Packages Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ----------------------------- TOGGLE ACTIVE -----------------------------
exports.toggleActiveStatus = async (req, res) => {
  try {
    const pkg = await Catering.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, error: "Not found" });

    pkg.isActive = !pkg.isActive;
    await pkg.save();

    res.json({
      success: true,
      message: `Catering ${pkg.isActive ? "activated" : "deactivated"}`,
      data: pkg
    });

  } catch (err) {
    console.log("❌ Toggle Active Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ----------------------------- TOGGLE TOP PICK -----------------------------
exports.toggleTopPickStatus = async (req, res) => {
  try {
    const pkg = await Catering.findById(req.params.id);
    if (!pkg) return res.status(404).json({ success: false, error: "Not found" });

    pkg.isTopPick = !pkg.isTopPick;
    await pkg.save();

    res.json({
      success: true,
      message: `Top pick ${pkg.isTopPick ? "enabled" : "disabled"}`,
      data: pkg
    });

  } catch (err) {
    console.log("❌ Toggle TopPick Error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
