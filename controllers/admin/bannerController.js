const mongoose = require("mongoose");
const Banner = require("../../models/admin/banner");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
} = require("../../utils/responseFormatter");

// Multer upload
const createUpload = require("../../middlewares/upload");
const upload = createUpload("banners", { fileSizeMB: 2 });

// ----------------------- GET ALL BANNERS -----------------------
exports.getAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10, zone, bannerType, isActive, isFeatured } =
      req.query;

    const filter = {};
    if (zone) filter.zone = zone;
    if (bannerType) filter.bannerType = bannerType.toLowerCase();
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";

    const banners = await Banner.find(filter)
      .populate("zone", "name")
      .populate("store", "storeName")
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

// ----------------------- GET BANNER BY ID -----------------------
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id)
      .populate("zone", "name")
      .populate("store", "storeName");

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
exports.createBanner = [
  upload.single("image"), // Multer middleware for FormData

  async (req, res) => {
    try {
      const { zone, bannerType, title, ...otherData } = req.body;

      console.log("File received:", req.file);

      // Validate required fields
      if (!title || !title.trim()) {
        return errorResponse(res, "Banner title is required", 400);
      }

      if (!bannerType) {
        return errorResponse(res, "Banner type is required", 400);
      }

      const normalizedBannerType = bannerType.toLowerCase().trim();
      const validTypes = ["top_deal", "cash_back", "zone_wise"];
      if (!validTypes.includes(normalizedBannerType)) {
        return errorResponse(
          res,
          `Invalid banner type: ${bannerType}. Valid types are: ${validTypes.join(
            ", "
          )}`,
          400
        );
      }

      // Handle zone conversion
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

      // Build banner data
      const bannerData = {
        ...otherData,
        title: title.trim(),
        zone: zoneId,
        bannerType: normalizedBannerType,
      };

      // Handle file upload
      if (req.file) {
        bannerData.image = req.file.path
          ? req.file.path.replace(/\\/g, "/")
          : req.file.location;
      } else if (!bannerData.image) {
        return errorResponse(res, "Banner image is required", 400);
      }

      const banner = new Banner(bannerData);
      await banner.save();

      const populatedBanner = await Banner.findById(banner._id)
        .populate("zone", "name")
        .populate("store", "storeName");

      return res.status(201).json({
        success: true,
        message: "Banner created",
        banner: populatedBanner,
      });
    } catch (error) {
      console.error("Create banner error:", error);

      if (error.name === "ValidationError") {
        const errors = Object.values(error.errors).map((err) => err.message);
        return errorResponse(res, errors.join(", "), 400);
      }

      if (error.code === 11000) {
        return errorResponse(res, "A banner with this data already exists", 400);
      }

      return errorResponse(res, error.message || "Error creating banner", 500);
    }
  },
];

// ----------------------- UPDATE BANNER -----------------------
exports.updateBanner = [
  upload.single("image"), // Support file updates

  async (req, res) => {
    try {
      const banner = await Banner.findById(req.params.id);
      if (!banner) return errorResponse(res, "Banner not found", 404);

      const updateData = { ...req.body };

      // Validate title if provided
      if (
        updateData.title !== undefined &&
        (!updateData.title || !updateData.title.trim())
      ) {
        return errorResponse(res, "Banner title cannot be empty", 400);
      }

      if (updateData.title) {
        updateData.title = updateData.title.trim();
      }

      // Handle zone conversion
      if (updateData.zone && !mongoose.Types.ObjectId.isValid(updateData.zone)) {
        const Zone = mongoose.model("Zone");
        const zoneDoc = await Zone.findOne({ name: updateData.zone });
        if (!zoneDoc) {
          return errorResponse(
            res,
            "Zone not found. Please provide a valid zone ID or name",
            400
          );
        }
        updateData.zone = zoneDoc._id;
      }

      // Normalize bannerType
      if (updateData.bannerType) {
        updateData.bannerType = updateData.bannerType.toLowerCase().trim();
        const validTypes = ["top_deal", "cash_back", "zone_wise"];
        if (!validTypes.includes(updateData.bannerType)) {
          return errorResponse(
            res,
            `Invalid banner type: ${updateData.bannerType}. Valid types are: ${validTypes.join(
              ", "
            )}`,
            400
          );
        }
      }

      // Handle file upload
      if (req.file) {
        updateData.image = req.file.path
          ? req.file.path.replace(/\\/g, "/")
          : req.file.location;
      }

      const updatedBanner = await Banner.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate([
        { path: "zone", select: "name" },
        { path: "store", select: "storeName" },
      ]);

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
  },
];

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

    const updatedBanner = await Banner.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate([
      { path: "zone", select: "name" },
      { path: "store", select: "storeName" },
    ]);

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
