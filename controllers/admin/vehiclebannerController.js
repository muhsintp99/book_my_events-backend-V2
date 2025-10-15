const mongoose = require("mongoose");
const VehicleBanner = require("../../models/admin/vehicleBannerModel");
const { successResponse, errorResponse, paginatedResponse } = require("../../utils/responseFormatter");
const createUpload = require("../../middlewares/upload");

const upload = createUpload("vehicleBanners", { fileSizeMB: 2 });

// Helper: populate
const getPopulateOptions = () => {
  const populateArray = [{ path: "zone", select: "name" }];

  try {
    mongoose.model("Vendor");
    populateArray.push({ path: "vendor", select: "businessName email phoneNumber" });
  } catch (e) {}

  try {
    mongoose.model("VehicleCategory");
    populateArray.push({ path: "vehicleCategory", select: "title" });
  } catch (e) {}

  return populateArray;
};

// ----------------------- GET ALL VEHICLE BANNERS -----------------------
exports.getAllVehicleBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, zone, bannerType, isActive, isFeatured, vendor } = req.query;

    const filter = { vendor: null }; // Only global banners by default
    if (zone) filter.zone = zone;
    if (bannerType) filter.bannerType = bannerType.toLowerCase();
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

    const banners = await VehicleBanner.find(filter)
      .populate(getPopulateOptions())
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await VehicleBanner.countDocuments(filter);

    return paginatedResponse(res, { banners }, {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
    }, "Vehicle banners fetched successfully");
  } catch (error) {
    console.error("Get vehicle banners error:", error);
    return errorResponse(res, "Error fetching vehicle banners", 500);
  }
};

// ----------------------- GET VEHICLE BANNERS BY VENDOR -----------------------
exports.getVehicleBannersByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 10, isActive, isFeatured, bannerType } = req.query;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) return errorResponse(res, "Invalid vendor ID", 400);

    const filter = { vendor: vendorId };
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
    if (bannerType) filter.bannerType = bannerType.toLowerCase();

    const banners = await VehicleBanner.find(filter)
      .populate(getPopulateOptions())
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await VehicleBanner.countDocuments(filter);

    return paginatedResponse(res, { banners }, {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit),
    }, "Vehicle banners fetched successfully for vendor");
  } catch (error) {
    console.error("Get vendor vehicle banners error:", error);
    return errorResponse(res, "Error fetching vendor vehicle banners", 500);
  }
};

// ----------------------- GET VEHICLE BANNER BY ID -----------------------
exports.getVehicleBannerById = async (req, res) => {
  try {
    const banner = await VehicleBanner.findById(req.params.id).populate(getPopulateOptions());
    if (!banner) return errorResponse(res, "Vehicle banner not found", 404);

    return successResponse(res, { banner }, "Vehicle banner fetched successfully");
  } catch (error) {
    console.error("Get vehicle banner error:", error);
    return errorResponse(res, "Error fetching vehicle banner", 500);
  }
};

// ----------------------- CREATE VEHICLE BANNER -----------------------
exports.createVehicleBanner = async (req, res) => {
  upload.single("image")(req, res, async (uploadErr) => {
    if (uploadErr) return errorResponse(res, uploadErr.message || "Error uploading file", 400);

    try {
      const { zone, bannerType, title, vendor, vehicleCategory, ...otherData } = req.body;

      if (!title || !title.trim()) return errorResponse(res, "Banner title is required", 400);
      if (!bannerType) return errorResponse(res, "Banner type is required", 400);

      let zoneId = zone;
      if (zone) {
        if (!mongoose.Types.ObjectId.isValid(zone)) {
          const Zone = mongoose.model("Zone");
          const zoneDoc = await Zone.findOne({ name: zone });
          if (!zoneDoc) return errorResponse(res, "Zone not found", 400);
          zoneId = zoneDoc._id;
        }
      } else return errorResponse(res, "Zone is required", 400);

      if (vendor && !mongoose.Types.ObjectId.isValid(vendor)) return errorResponse(res, "Invalid vendor ID", 400);
      if (vehicleCategory && !mongoose.Types.ObjectId.isValid(vehicleCategory)) return errorResponse(res, "Invalid vehicleCategory ID", 400);

      const bannerData = {
        ...otherData,
        title: title.trim(),
        zone: zoneId,
        bannerType: bannerType.toLowerCase().trim(),
      };

      if (vendor) bannerData.vendor = vendor;
      if (vehicleCategory) bannerData.vehicleCategory = vehicleCategory;
      if (req.file) bannerData.image = req.file.path.replace(/\\/g, "/");

      const banner = new VehicleBanner(bannerData);
      await banner.save();

      const populatedBanner = await VehicleBanner.findById(banner._id).populate(getPopulateOptions());

      return res.status(201).json({ success: true, message: "Vehicle banner created", banner: populatedBanner });
    } catch (error) {
      console.error("Create vehicle banner error:", error);
      return errorResponse(res, error.message || "Error creating vehicle banner", 500);
    }
  });
};

// ----------------------- UPDATE VEHICLE BANNER -----------------------
exports.updateVehicleBanner = async (req, res) => {
  upload.single("image")(req, res, async (uploadErr) => {
    if (uploadErr) return errorResponse(res, uploadErr.message || "Error uploading file", 400);

    try {
      const banner = await VehicleBanner.findById(req.params.id);
      if (!banner) return errorResponse(res, "Vehicle banner not found", 404);

      const updateData = { ...req.body };
      if (updateData.title) updateData.title = updateData.title.trim();
      if (req.file) updateData.image = req.file.path.replace(/\\/g, "/");

      if (updateData.zone && !mongoose.Types.ObjectId.isValid(updateData.zone)) {
        const Zone = mongoose.model("Zone");
        const zoneDoc = await Zone.findOne({ name: updateData.zone });
        if (!zoneDoc) return errorResponse(res, "Zone not found", 400);
        updateData.zone = zoneDoc._id;
      }

      const updatedBanner = await VehicleBanner.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true }).populate(getPopulateOptions());
      return successResponse(res, { banner: updatedBanner }, "Vehicle banner updated successfully");
    } catch (error) {
      console.error("Update vehicle banner error:", error);
      return errorResponse(res, error.message || "Error updating vehicle banner", 500);
    }
  });
};

// ----------------------- DELETE VEHICLE BANNER -----------------------
exports.deleteVehicleBanner = async (req, res) => {
  try {
    const banner = await VehicleBanner.findById(req.params.id);
    if (!banner) return errorResponse(res, "Vehicle banner not found", 404);

    await VehicleBanner.findByIdAndDelete(req.params.id);
    return successResponse(res, null, "Vehicle banner deleted successfully");
  } catch (error) {
    console.error("Delete vehicle banner error:", error);
    return errorResponse(res, "Error deleting vehicle banner", 500);
  }
};

// ----------------------- TOGGLE STATUS -----------------------
exports.toggleVehicleBannerStatus = async (req, res) => {
  try {
    const banner = await VehicleBanner.findById(req.params.id);
    if (!banner) return errorResponse(res, "Vehicle banner not found", 404);

    const updateData = {};
    if (req.body.hasOwnProperty("isActive")) updateData.isActive = req.body.isActive;
    if (req.body.hasOwnProperty("isFeatured")) updateData.isFeatured = req.body.isFeatured;

    if (!Object.keys(updateData).length) return errorResponse(res, "No valid fields to update", 400);

    const updatedBanner = await VehicleBanner.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate(getPopulateOptions());
    return successResponse(res, { banner: updatedBanner }, "Vehicle banner status updated successfully");
  } catch (error) {
    console.error("Toggle vehicle banner status error:", error);
    return errorResponse(res, "Error updating vehicle banner status", 500);
  }
};

// ----------------------- INCREMENT CLICK -----------------------
exports.incrementVehicleBannerClick = async (req, res) => {
  try {
    const banner = await VehicleBanner.findByIdAndUpdate(req.params.id, { $inc: { clickCount: 1 } }, { new: true });
    if (!banner) return errorResponse(res, "Vehicle banner not found", 404);
    return successResponse(res, { banner }, "Vehicle banner click recorded");
  } catch (error) {
    console.error("Increment vehicle banner click error:", error);
    return errorResponse(res, "Error recording vehicle banner click", 500);
  }
};
