// const mongoose = require("mongoose");
// const Banner = require("../../models/admin/banner");

// const {
//   successResponse,
//   errorResponse,
//   paginatedResponse,
// } = require("../../utils/responseFormatter");

// const createUpload = require("../../middlewares/upload");
// const upload = createUpload("banners", { fileSizeMB: 2 });

// // Helper function to check and populate models
// const getPopulateOptions = () => {
//   const populateArray = [{ path: "zone", select: "name" }];
  
//   try {
//     mongoose.model('Store');
//     populateArray.push({ path: "store", select: "storeName" });
//   } catch (e) {}

//   try {
//     mongoose.model('Vendor');
//     populateArray.push({ path: "vendor", select: "businessName email phoneNumber" });
//   } catch (e) {}

//   return populateArray;
// };

// // ----------------------- GET ALL BANNERS -----------------------
// exports.getAllBanners = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, zone, bannerType, isActive, isFeatured, vendor } =
//       req.query;

//     const filter = {
//       vendor: null  // Only fetch banners where vendor is null
//     };
    
//     if (zone) filter.zone = zone;
//     if (bannerType) filter.bannerType = bannerType.toLowerCase();
//     if (isActive !== undefined) filter.isActive = isActive === "true";
//     if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
//     // Remove the vendor filter from query params since we always want vendor: null
//     // if (vendor) filter.vendor = vendor;

//     const banners = await Banner.find(filter)
//       .populate(getPopulateOptions())
//       .sort({ displayOrder: 1, createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Banner.countDocuments(filter);

//     const pagination = {
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(total / limit),
//       totalItems: total,
//       itemsPerPage: parseInt(limit),
//     };

//     return paginatedResponse(
//       res,
//       { banners },
//       pagination,
//       "Banners fetched successfully"
//     );
//   } catch (error) {
//     console.error("Get banners error:", error);
//     return errorResponse(res, "Error fetching banners", 500);
//   }
// };

// // ----------------------- GET BANNERS BY VENDOR ID -----------------------
// exports.getBannersByVendor = async (req, res) => {
//   try {
//     const { vendorId } = req.params;
//     const { page = 1, limit = 10, isActive, isFeatured, bannerType } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(vendorId)) {
//       return errorResponse(res, "Invalid vendor ID", 400);
//     }

//     const filter = { vendor: vendorId };
//     if (isActive !== undefined) filter.isActive = isActive === "true";
//     if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
//     if (bannerType) filter.bannerType = bannerType.toLowerCase();

//     const banners = await Banner.find(filter)
//       .populate(getPopulateOptions())
//       .sort({ displayOrder: 1, createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const total = await Banner.countDocuments(filter);

//     const pagination = {
//       currentPage: parseInt(page),
//       totalPages: Math.ceil(total / limit),
//       totalItems: total,
//       itemsPerPage: parseInt(limit),
//     };

//     return paginatedResponse(
//       res,
//       { banners },
//       pagination,
//       `Banners fetched successfully for vendor`
//     );
//   } catch (error) {
//     console.error("Get vendor banners error:", error);
//     return errorResponse(res, "Error fetching vendor banners", 500);
//   }
// };

// // ----------------------- GET BANNER BY ID -----------------------
// exports.getBannerById = async (req, res) => {
//   try {
//     const banner = await Banner.findById(req.params.id)
//       .populate(getPopulateOptions());

//     if (!banner) {
//       return errorResponse(res, "Banner not found", 404);
//     }

//     return successResponse(res, { banner }, "Banner fetched successfully");
//   } catch (error) {
//     console.error("Get banner error:", error);
//     return errorResponse(res, "Error fetching banner", 500);
//   }
// };

// // ----------------------- CREATE BANNER -----------------------
// exports.createBanner = async (req, res) => {
//   // Handle multer upload with error catching
//   upload.single("image")(req, res, async (uploadErr) => {
//     if (uploadErr) {
//       console.error("Upload error:", uploadErr);
//       return errorResponse(res, uploadErr.message || "Error uploading file", 400);
//     }

//     try {
//       const { zone, bannerType, title, vendor, ...otherData } = req.body;

//       console.log("File received:", req.file);

//       if (!title || !title.trim()) {
//         return errorResponse(res, "Banner title is required", 400);
//       }

//       if (!bannerType) {
//         return errorResponse(res, "Banner type is required", 400);
//       }

//       const normalizedBannerType = bannerType.toLowerCase().trim();
//       const validTypes = ["top_deal", "cash_back", "zone_wise"];
//       if (!validTypes.includes(normalizedBannerType)) {
//         return errorResponse(
//           res,
//           `Invalid banner type: ${bannerType}. Valid types are: ${validTypes.join(", ")}`,
//           400
//         );
//       }

//       let zoneId = zone;
//       if (zone) {
//         if (!mongoose.Types.ObjectId.isValid(zone)) {
//           const Zone = mongoose.model("Zone");
//           const zoneDoc = await Zone.findOne({ name: zone });
//           if (!zoneDoc) {
//             return errorResponse(
//               res,
//               "Zone not found. Please provide a valid zone ID or name",
//               400
//             );
//           }
//           zoneId = zoneDoc._id;
//         }
//       } else {
//         return errorResponse(res, "Zone is required", 400);
//       }

//       // Validate vendor if provided
//       if (vendor) {
//         if (!mongoose.Types.ObjectId.isValid(vendor)) {
//           return errorResponse(res, "Invalid vendor ID format", 400);
//         }
        
//         try {
//           const Vendor = mongoose.model("Vendor");
//           const vendorDoc = await Vendor.findById(vendor);
//           if (!vendorDoc) {
//             return errorResponse(res, "Vendor not found", 400);
//           }
//         } catch (e) {
//           console.warn('Vendor model not available');
//         }
//       }

//       const bannerData = {
//         ...otherData,
//         title: title.trim(),
//         zone: zoneId,
//         bannerType: normalizedBannerType,
//       };

//       if (vendor) {
//         bannerData.vendor = vendor;
//       }

//       if (req.file) {
//         bannerData.image = req.file.path
//           ? req.file.path.replace(/\\/g, "/")
//           : req.file.location;
//       } else if (!bannerData.image) {
//         return errorResponse(res, "Banner image is required", 400);
//       }

//       const banner = new Banner(bannerData);
//       await banner.save();

//       const populatedBanner = await Banner.findById(banner._id)
//         .populate(getPopulateOptions());

//       return res.status(201).json({
//         success: true,
//         message: "Banner created",
//         banner: populatedBanner,
//       });
//     } catch (error) {
//       console.error("Create banner error:", error);

//       if (error.name === "ValidationError") {
//         const errors = Object.values(error.errors).map((err) => err.message);
//         return errorResponse(res, errors.join(", "), 400);
//       }

//       if (error.code === 11000) {
//         return errorResponse(res, "A banner with this data already exists", 400);
//       }

//       return errorResponse(res, error.message || "Error creating banner", 500);
//     }
//   });
// };

// // ----------------------- UPDATE BANNER -----------------------
// exports.updateBanner = async (req, res) => {
//   // Handle multer upload with error catching
//   upload.single("image")(req, res, async (uploadErr) => {
//     if (uploadErr) {
//       console.error("Upload error:", uploadErr);
//       return errorResponse(res, uploadErr.message || "Error uploading file", 400);
//     }

//     try {
//       const banner = await Banner.findById(req.params.id);
//       if (!banner) return errorResponse(res, "Banner not found", 404);

//       const updateData = { ...req.body };

//       if (
//         updateData.title !== undefined &&
//         (!updateData.title || !updateData.title.trim())
//       ) {
//         return errorResponse(res, "Banner title cannot be empty", 400);
//       }

//       if (updateData.title) {
//         updateData.title = updateData.title.trim();
//       }

//       if (updateData.zone && !mongoose.Types.ObjectId.isValid(updateData.zone)) {
//         const Zone = mongoose.model("Zone");
//         const zoneDoc = await Zone.findOne({ name: updateData.zone });
//         if (!zoneDoc) {
//           return errorResponse(
//             res,
//             "Zone not found. Please provide a valid zone ID or name",
//             400
//           );
//         }
//         updateData.zone = zoneDoc._id;
//       }

//       // Validate vendor if being updated
//       if (updateData.vendor) {
//         if (!mongoose.Types.ObjectId.isValid(updateData.vendor)) {
//           return errorResponse(res, "Invalid vendor ID format", 400);
//         }
        
//         try {
//           const Vendor = mongoose.model("Vendor");
//           const vendorDoc = await Vendor.findById(updateData.vendor);
//           if (!vendorDoc) {
//             return errorResponse(res, "Vendor not found", 400);
//           }
//         } catch (e) {
//           console.warn('Vendor model not available');
//         }
//       }

//       if (updateData.bannerType) {
//         updateData.bannerType = updateData.bannerType.toLowerCase().trim();
//         const validTypes = ["top_deal", "cash_back", "zone_wise"];
//         if (!validTypes.includes(updateData.bannerType)) {
//           return errorResponse(
//             res,
//             `Invalid banner type: ${updateData.bannerType}. Valid types are: ${validTypes.join(", ")}`,
//             400
//           );
//         }
//       }

//       if (req.file) {
//         updateData.image = req.file.path
//           ? req.file.path.replace(/\\/g, "/")
//           : req.file.location;
//       }

//       const updatedBanner = await Banner.findByIdAndUpdate(
//         req.params.id,
//         updateData,
//         { new: true, runValidators: true }
//       ).populate(getPopulateOptions());

//       return successResponse(
//         res,
//         { banner: updatedBanner },
//         "Banner updated successfully"
//       );
//     } catch (error) {
//       console.error("Update banner error:", error);
//       if (error.name === "ValidationError") {
//         const errors = Object.values(error.errors).map((err) => err.message);
//         return errorResponse(res, errors.join(", "), 400);
//       }
//       return errorResponse(res, error.message || "Error updating banner", 500);
//     }
//   });
// };

// // ----------------------- DELETE BANNER -----------------------
// exports.deleteBanner = async (req, res) => {
//   try {
//     const banner = await Banner.findById(req.params.id);
//     if (!banner) return errorResponse(res, "Banner not found", 404);

//     await Banner.findByIdAndDelete(req.params.id);
//     return successResponse(res, null, "Banner deleted successfully");
//   } catch (error) {
//     console.error("Delete banner error:", error);
//     return errorResponse(res, "Error deleting banner", 500);
//   }
// };

// // ----------------------- TOGGLE STATUS -----------------------
// exports.toggleBannerStatus = async (req, res) => {
//   try {
//     const banner = await Banner.findById(req.params.id);
//     if (!banner) return errorResponse(res, "Banner not found", 404);

//     const updateData = {};
//     if (req.body.hasOwnProperty("isActive"))
//       updateData.isActive = req.body.isActive;
//     if (req.body.hasOwnProperty("isFeatured"))
//       updateData.isFeatured = req.body.isFeatured;

//     if (Object.keys(updateData).length === 0) {
//       return errorResponse(res, "No valid fields to update", 400);
//     }

//     const updatedBanner = await Banner.findByIdAndUpdate(
//       req.params.id, 
//       updateData, 
//       { new: true }
//     ).populate(getPopulateOptions());

//     return successResponse(
//       res,
//       { banner: updatedBanner },
//       "Banner status updated successfully"
//     );
//   } catch (error) {
//     console.error("Toggle banner status error:", error);
//     return errorResponse(res, "Error updating banner status", 500);
//   }
// };

// // ----------------------- INCREMENT CLICK -----------------------
// exports.incrementBannerClick = async (req, res) => {
//   try {
//     const banner = await Banner.findByIdAndUpdate(
//       req.params.id,
//       { $inc: { clickCount: 1 } },
//       { new: true }
//     );

//     if (!banner) return errorResponse(res, "Banner not found", 404);

//     return successResponse(res, { banner }, "Banner click recorded");
//   } catch (error) {
//     console.error("Increment banner click error:", error);
//     return errorResponse(res, "Error recording banner click", 500);
//   }
// };













const mongoose = require("mongoose");
const Banner = require("../../models/admin/banner");

const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../../utils/responseFormatter");

const createUpload = require("../../middlewares/upload");
const upload = createUpload("banners", { fileSizeMB: 2 });

// Helper function to check and populate models
const getPopulateOptions = () => {
  const populateArray = [
    { path: "zone", select: "name" },
    { path: "module", select: "name type" }, // ✅ Added module populate
  ];

  try {
    mongoose.model("Store");
    populateArray.push({ path: "store", select: "storeName" });
  } catch (e) {}

  try {
    mongoose.model("Vendor");
    populateArray.push({
      path: "vendor",
      select: "businessName email phoneNumber",
    });
  } catch (e) {}

  return populateArray;
};

// ----------------------- GET ALL BANNERS -----------------------
exports.getAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, zone, bannerType, isActive, isFeatured } =
      req.query;

    const filter = { vendor: null };

    if (zone) filter.zone = zone;
    if (bannerType) filter.bannerType = bannerType.toLowerCase();
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

    const banners = await Banner.find(filter)
      .populate(getPopulateOptions())
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Banner.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
    };

    return paginatedResponse(
      res,
      { banners },
      pagination,
      "Banners fetched successfully"
    );
  } catch (error) {
    console.error("Get banners error:", error);
    return errorResponse(res, "Error fetching banners", 500);
  }
};

// ----------------------- GET BANNERS BY MODULE ID -----------------------
exports.getBannersByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { page = 1, limit = 10, isActive, isFeatured, bannerType } = req.query;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return errorResponse(res, "Invalid module ID", 400);
    }

    const filter = { module: moduleId };
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
    if (bannerType) filter.bannerType = bannerType.toLowerCase();

    const banners = await Banner.find(filter)
      .populate(getPopulateOptions())
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Banner.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
    };

    return paginatedResponse(
      res,
      { banners },
      pagination,
      "Banners fetched successfully for module"
    );
  } catch (error) {
    console.error("Get module banners error:", error);
    return errorResponse(res, "Error fetching module banners", 500);
  }
};

// ----------------------- GET BANNERS BY VENDOR ID -----------------------
exports.getBannersByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10, isActive, isFeatured, bannerType } = req.query;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return errorResponse(res, "Invalid vendor ID", 400);
    }

    const filter = { vendor: vendorId };
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
    if (bannerType) filter.bannerType = bannerType.toLowerCase();

    const banners = await Banner.find(filter)
      .populate(getPopulateOptions())
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Banner.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
    };

    return paginatedResponse(
      res,
      { banners },
      pagination,
      `Banners fetched successfully for vendor`
    );
  } catch (error) {
    console.error("Get vendor banners error:", error);
    return errorResponse(res, "Error fetching vendor banners", 500);
  }
};

// ----------------------- GET BANNER BY ID -----------------------
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id).populate(
      getPopulateOptions()
    );

    if (!banner) {
      return errorResponse(res, "Banner not found", 404);
    }

    return successResponse(res, { banner }, "Banner fetched successfully");
  } catch (error) {
    console.error("Get banner error:", error);
    return errorResponse(res, "Error fetching banner", 500);
  }
};

// ----------------------- CREATE BANNER -----------------------
exports.createBanner = async (req, res) => {
  upload.single("image")(req, res, async (uploadErr) => {
    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return errorResponse(res, uploadErr.message || "Error uploading file", 400);
    }

    try {
      const { zone, bannerType, title, vendor, moduleId, ...otherData } = req.body;

      if (!title || !title.trim()) {
        return errorResponse(res, "Banner title is required", 400);
      }

      if (!bannerType) {
        return errorResponse(res, "Banner type is required", 400);
      }

      if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
        return errorResponse(res, "Valid moduleId is required", 400);
      }

      // Optional: validate module existence
      try {
        const Module = mongoose.model("Module");
        const moduleDoc = await Module.findById(moduleId);
        if (!moduleDoc) return errorResponse(res, "Module not found", 400);
      } catch (err) {
        console.warn("Module model not registered");
      }

      const normalizedBannerType = bannerType.toLowerCase().trim();
      const validTypes = ["top_deal", "cash_back", "zone_wise"];
      if (!validTypes.includes(normalizedBannerType)) {
        return errorResponse(
          res,
          `Invalid banner type: ${bannerType}. Valid types are: ${validTypes.join(", ")}`,
          400
        );
      }

      let zoneId = zone;
      if (zone) {
        if (!mongoose.Types.ObjectId.isValid(zone)) {
          const Zone = mongoose.model("Zone");
          const zoneDoc = await Zone.findOne({ name: zone });
          if (!zoneDoc) {
            return errorResponse(
              res,
              "Zone not found. Please provide a valid zone ID or name",
              400
            );
          }
          zoneId = zoneDoc._id;
        }
      } else {
        return errorResponse(res, "Zone is required", 400);
      }

      if (vendor) {
        if (!mongoose.Types.ObjectId.isValid(vendor)) {
          return errorResponse(res, "Invalid vendor ID format", 400);
        }
        try {
          const Vendor = mongoose.model("Vendor");
          const vendorDoc = await Vendor.findById(vendor);
          if (!vendorDoc) return errorResponse(res, "Vendor not found", 400);
        } catch (e) {
          console.warn("Vendor model not available");
        }
      }

      const bannerData = {
        ...otherData,
        title: title.trim(),
        zone: zoneId,
        module: moduleId,
        bannerType: normalizedBannerType,
      };

      if (vendor) bannerData.vendor = vendor;

      if (req.file) {
        bannerData.image = req.file.path
          ? req.file.path.replace(/\\/g, "/")
          : req.file.location;
      } else if (!bannerData.image) {
        return errorResponse(res, "Banner image is required", 400);
      }

      const banner = new Banner(bannerData);
      await banner.save();

      const populatedBanner = await Banner.findById(banner._id).populate(
        getPopulateOptions()
      );

      return res.status(201).json({
        success: true,
        message: "Banner created successfully",
        banner: populatedBanner,
      });
    } catch (error) {
      console.error("Create banner error:", error);
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return errorResponse(res, errors.join(", "), 400);
      }
      if (error.code === 11000) {
        return errorResponse(res, "Duplicate banner entry", 400);
      }
      return errorResponse(res, error.message || "Error creating banner", 500);
    }
  });
};

// ----------------------- UPDATE BANNER -----------------------
exports.updateBanner = async (req, res) => {
  upload.single("image")(req, res, async (uploadErr) => {
    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return errorResponse(res, uploadErr.message || "Error uploading file", 400);
    }

    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) return errorResponse(res, "Banner not found", 404);

      const updateData = { ...req.body };

      if (updateData.title && !updateData.title.trim()) {
        return errorResponse(res, "Banner title cannot be empty", 400);
      }

      if (updateData.moduleId) {
        if (!mongoose.Types.ObjectId.isValid(updateData.moduleId)) {
          return errorResponse(res, "Invalid module ID", 400);
        }
        updateData.module = updateData.moduleId;
        delete updateData.moduleId;
      }

      if (updateData.zone && !mongoose.Types.ObjectId.isValid(updateData.zone)) {
        const Zone = mongoose.model("Zone");
        const zoneDoc = await Zone.findOne({ name: updateData.zone });
        if (!zoneDoc) {
          return errorResponse(res, "Zone not found", 400);
        }
        updateData.zone = zoneDoc._id;
      }

      if (req.file) {
        updateData.image = req.file.path
          ? req.file.path.replace(/\\/g, "/")
          : req.file.location;
      }

      const updatedBanner = await Banner.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate(getPopulateOptions());

      return successResponse(
        res,
        { banner: updatedBanner },
        "Banner updated successfully"
      );
    } catch (error) {
      console.error("Update banner error:", error);
      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return errorResponse(res, errors.join(", "), 400);
      }
      return errorResponse(res, error.message || "Error updating banner", 500);
    }
  });
};

// ----------------------- DELETE BANNER -----------------------
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return errorResponse(res, "Banner not found", 404);

    await Banner.findByIdAndDelete(req.params.id);
    return successResponse(res, null, "Banner deleted successfully");
  } catch (error) {
    console.error("Delete banner error:", error);
    return errorResponse(res, "Error deleting banner", 500);
  }
};

// ----------------------- TOGGLE STATUS -----------------------
exports.toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return errorResponse(res, "Banner not found", 404);

    const updateData = {};
    if (req.body.hasOwnProperty("isActive"))
      updateData.isActive = req.body.isActive;
    if (req.body.hasOwnProperty("isFeatured"))
      updateData.isFeatured = req.body.isFeatured;

    if (Object.keys(updateData).length === 0) {
      return errorResponse(res, "No valid fields to update", 400);
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate(getPopulateOptions());

    return successResponse(
      res,
      { banner: updatedBanner },
      "Banner status updated successfully"
    );
  } catch (error) {
    console.error("Toggle banner status error:", error);
    return errorResponse(res, "Error updating banner status", 500);
  }
};

// ----------------------- INCREMENT CLICK -----------------------
exports.incrementBannerClick = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $inc: { clickCount: 1 } },
      { new: true }
    );

    if (!banner) return errorResponse(res, "Banner not found", 404);

    return successResponse(res, { banner }, "Banner click recorded");
  } catch (error) {
    console.error("Increment banner click error:", error);
    return errorResponse(res, "Error recording banner click", 500);
  }
};
