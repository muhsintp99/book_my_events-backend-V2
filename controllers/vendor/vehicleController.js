const Vehicle = require("../../models/vendor/Vehicle");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const Subscription = require("../../models/admin/Subscription");
const fs = require("fs").promises;
const path = require("path");
const mongoose = require("mongoose");
const Category = require("../../models/admin/category");

// ================= HELPERS =================
const deleteFiles = async (files = []) => {
  if (!files.length) return;
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.resolve(__dirname, "../../Uploads/vehicles", file);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        if (err.code !== "ENOENT")
          console.error(`Failed to delete ${file}:`, err);
      }
    })
  );
};
const populateSubCategories = async (vehicle) => {
  if (!vehicle || !vehicle.subCategories?.length || !vehicle.category?._id) {
    return;
  }

  const subCategoryDocs = await Category.find({
    _id: { $in: vehicle.subCategories },
    parentCategory: vehicle.category._id,
    isActive: true,
  }).select("title image isActive");

  vehicle.subCategories = subCategoryDocs;
};

const VEHICLE_UPLOAD_PATH = "/uploads/vehicles";

const normalizeVehiclePath = (value) => {
  if (!value) return value;

  // Already absolute or already prefixed
  if (value.startsWith("/uploads/")) {
    return value;
  }

  // Only filename → prepend path
  return `${VEHICLE_UPLOAD_PATH}/${value}`;
};

const attachVehicleImageUrls = (vehicle) => {
  if (!vehicle) return vehicle;

  if (vehicle.thumbnail) {
    vehicle.thumbnail = normalizeVehiclePath(vehicle.thumbnail);
  }

  if (Array.isArray(vehicle.images)) {
    vehicle.images = vehicle.images.map(normalizeVehiclePath);
  }

  if (Array.isArray(vehicle.documents)) {
    vehicle.documents = vehicle.documents.map(normalizeVehiclePath);
  }

  return vehicle;
};

const sendResponse = (
  res,
  status,
  success,
  message,
  data = null,
  meta = null
) => {
  const response = { success, message };
  if (data) response.data = data;
  if (meta) response.meta = meta;
  return res.status(status).json(response);
};

const populateProvider = {
  path: "provider",
  select:
    "-password -email -refreshToken -resetPasswordToken -resetPasswordExpire -firstName -lastName -vinNumber",
};

// Parse ObjectId arrays (for categories, brands)
const parseObjectIdArray = (value) => {
  if (!value) return [];

  let parsed = value;

  if (typeof parsed === "string") {
    parsed = parsed.trim();
    try {
      parsed = JSON.parse(parsed);
      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }
    } catch {
      parsed = parsed
        .replace(/[\[\]"']/g, "")
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c);
    }
  }

  if (Array.isArray(parsed)) {
    const validIds = parsed
      .flat()
      .filter((c) => c && mongoose.Types.ObjectId.isValid(c))
      .map((c) => new mongoose.Types.ObjectId(c));
    return validIds;
  }

  return [];
};

// Parse string arrays (for connectivity, sensors, safety, etc.)
const parseStringArray = (value) => {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toLowerCase())
      .filter((item) => item);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim().toLowerCase())
          .filter((item) => item);
      }
    } catch (e) {
      // Not valid JSON, continue to CSV parsing
    }

    return trimmed
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((item) =>
        item
          .trim()
          .replace(/^["']|["']$/g, "")
          .toLowerCase()
      )
      .filter((item) => item);
  }

  return [];
};

const parseObjectId = (value) => {
  if (!value) return null;

  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    try {
      const parsed = JSON.parse(trimmed);
      if (mongoose.Types.ObjectId.isValid(parsed)) {
        return new mongoose.Types.ObjectId(parsed);
      }
    } catch (e) {
      if (mongoose.Types.ObjectId.isValid(trimmed)) {
        return new mongoose.Types.ObjectId(trimmed);
      }
    }
  }

  return null;
};

// Sanitize and parse request body
// Sanitize and parse request body - FIXED VERSION
const sanitizeVehicleData = (body) => {
  const sanitized = { ...body };

  /* ================= OBJECT IDs ================= */

  if (sanitized.brand) sanitized.brand = parseObjectId(sanitized.brand);
  if (sanitized.category) sanitized.category = parseObjectId(sanitized.category);

  if (sanitized.subCategories) {
    sanitized.subCategories = parseObjectIdArray(sanitized.subCategories);
  }

  /* ================= STRINGS ================= */

  if (sanitized.name) {
    sanitized.name =
      typeof sanitized.name === "string"
        ? sanitized.name.trim()
        : String(sanitized.name);
  }

  if (sanitized.description) {
    sanitized.description =
      typeof sanitized.description === "string"
        ? sanitized.description.trim()
        : String(sanitized.description);
  }

  if (sanitized.model) {
    sanitized.model =
      typeof sanitized.model === "string"
        ? sanitized.model.trim()
        : String(sanitized.model);
  }

  if (sanitized.vinNumber) {
    sanitized.vinNumber =
      typeof sanitized.vinNumber === "string"
        ? sanitized.vinNumber.trim()
        : String(sanitized.vinNumber);
  }

  if (sanitized.licensePlateNumber) {
    sanitized.licensePlateNumber =
      typeof sanitized.licensePlateNumber === "string"
        ? sanitized.licensePlateNumber.trim()
        : String(sanitized.licensePlateNumber);
  }

  /* ================= ARRAYS ================= */

  if (sanitized.searchTags !== undefined) {
    sanitized.searchTags = parseStringArray(sanitized.searchTags);
  }

  /* ================= BOOLEANS ================= */

  if (sanitized.airCondition !== undefined) {
    sanitized.airCondition =
      sanitized.airCondition === true ||
      sanitized.airCondition === "true";
  }

  if (sanitized.isActive !== undefined) {
    sanitized.isActive =
      sanitized.isActive === true || sanitized.isActive === "true";
  }

  if (sanitized.isAvailable !== undefined) {
    sanitized.isAvailable =
      sanitized.isAvailable === true || sanitized.isAvailable === "true";
  }

  /* ================= FEATURES (IMPORTANT) ================= */

  if (sanitized.features) {
    sanitized.features = {
      driverIncluded:
        sanitized.features.driverIncluded === true ||
        sanitized.features.driverIncluded === "true",

      sunroof:
        sanitized.features.sunroof === true ||
        sanitized.features.sunroof === "true",

      decorationAvailable:
        sanitized.features.decorationAvailable === true ||
        sanitized.features.decorationAvailable === "true",
    };
  }

  /* ================= NUMBERS ================= */

  if (sanitized.seatingCapacity !== undefined) {
    sanitized.seatingCapacity = Number(sanitized.seatingCapacity);
  }

  if (sanitized.discount !== undefined) {
    sanitized.discount = Number(sanitized.discount);
  }

  if (sanitized.advanceBookingAmount !== undefined) {
    const value = Number(sanitized.advanceBookingAmount);
    if (!isNaN(value)) sanitized.advanceBookingAmount = value;
  }

  if (sanitized.latitude !== undefined) {
    sanitized.latitude = Number(sanitized.latitude);
  }

  if (sanitized.longitude !== undefined) {
    sanitized.longitude = Number(sanitized.longitude);
  }

  /* ================= PRICING ================= */

  if (sanitized.pricing) {
    if (typeof sanitized.pricing === "string") {
      try {
        sanitized.pricing = JSON.parse(sanitized.pricing);
      } catch {
        delete sanitized.pricing;
      }
    }

    if (typeof sanitized.pricing === "object") {
      if (sanitized.pricing.hourly !== undefined)
        sanitized.pricing.hourly = Number(sanitized.pricing.hourly);

      if (sanitized.pricing.perDay !== undefined)
        sanitized.pricing.perDay = Number(sanitized.pricing.perDay);

      if (sanitized.pricing.distanceWise !== undefined)
        sanitized.pricing.distanceWise = Number(
          sanitized.pricing.distanceWise
        );
    }
  }

  return sanitized;
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to get effective price (min non-zero pricing)
const getEffectivePrice = (pricing) => {
  if (!pricing || typeof pricing !== "object") return 0;

  const prices = [];

  if (pricing.hourly && pricing.hourly > 0) prices.push(pricing.hourly);
  if (pricing.perDay && pricing.perDay > 0) prices.push(pricing.perDay);
  if (pricing.distanceWise && pricing.distanceWise > 0)
    prices.push(pricing.distanceWise);

  return prices.length > 0 ? Math.min(...prices) : 0;
};

// ================= CREATE =================
exports.createVehicle = async (req, res) => {
  const body = sanitizeVehicleData(req.body);

  // Provider auto-fill
  if (!body.provider && req.user) {
    body.provider = req.user._id;
  } else if (
    req.user?.role === "vendor" &&
    body.provider &&
    body.provider.toString() !== req.user._id.toString()
  ) {
    return sendResponse(res, 403, false, "Unauthorized: Invalid provider");
  }

  // Handle uploads
  if (req.files?.images) body.images = req.files.images.map((f) => f.filename);
  if (req.files?.thumbnail?.[0])
    body.thumbnail = req.files.thumbnail[0].filename;
  if (req.files?.documents)
    body.documents = req.files.documents.map((f) => f.filename);

  try {
    // Validate parent category
    if (body.category) {
      const parentExists = await Category.findById(body.category).select("_id");
      if (!parentExists) {
        return sendResponse(res, 400, false, "Invalid parent category");
      }
    }

    // ✅ FIXED: Validate subcategories properly
    if (body.subCategories?.length) {
      const parentCategory = await Category.findById(body.category).lean();

      console.log("📦 Parent category fetched:", parentCategory?.title);
      console.log("📦 Parent subCategories:", parentCategory?.subCategories);
      console.log("📦 Requested subCategories:", body.subCategories);

      if (!parentCategory) {
        return sendResponse(res, 400, false, "Invalid parent category");
      }

      // Extract valid subcategory IDs from parent's embedded subdocuments
      const validSubIds = Array.isArray(parentCategory.subCategories)
        ? parentCategory.subCategories.map((id) => id.toString())
        : [];

      console.log("✅ Valid subcategory IDs:", validSubIds);

      // Filter requested subcategories to only include valid ones
      const validRequestedSubs = body.subCategories.filter((id) =>
        validSubIds.includes(id.toString())
      );

      console.log("✅ Final valid subCategories:", validRequestedSubs);

      // Only set subcategories if there are valid ones
      if (validRequestedSubs.length > 0) {
        body.subCategories = validRequestedSubs;
      } else {
        console.warn("⚠️ No valid subcategories found, setting to empty array");
        body.subCategories = [];
      }
    }

    // Verify brand exists
    if (body.brand) {
      if (!mongoose.Types.ObjectId.isValid(body.brand)) {
        return sendResponse(res, 400, false, "Invalid brand ID format");
      }

      const existingBrand = await mongoose
        .model("Brand")
        .findById(body.brand)
        .select("_id");

      if (!existingBrand) {
        return sendResponse(
          res,
          400,
          false,
          "Brand does not exist in database"
        );
      }
    }

    const vehicle = await Vehicle.create(body);

    // Populate after creation
    // Populate after creation
    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive subCategories",
      })
      .populate(populateProvider)
      .populate("zone")
      .lean();
    attachVehicleImageUrls(populatedVehicle);

    // ✅ MANUAL subCategory population (THIS IS THE KEY)
    // ✅ MANUAL subCategory population (CORRECT WAY)
    if (populatedVehicle.subCategories?.length) {
      const subCategoryIds = populatedVehicle.subCategories.map((id) =>
        id.toString()
      );

      const subCategoryDocs = await Category.find({
        _id: { $in: subCategoryIds },
        parentCategory: populatedVehicle.category._id,
        isActive: true,
      }).select("title image isActive");

      populatedVehicle.subCategories = subCategoryDocs;
    }

    // Remove nested subCategories from category (clean response)
    if (populatedVehicle.category) {
      delete populatedVehicle.category.subCategories;
    }

    sendResponse(
      res,
      201,
      true,
      "Vehicle created successfully",
      populatedVehicle
    );
  } catch (error) {
    console.error("Error creating vehicle:", error);
    // Cleanup uploaded files if vehicle creation fails
    if (body.images?.length) await deleteFiles(body.images);
    if (body.thumbnail) await deleteFiles([body.thumbnail]);
    if (body.documents?.length) await deleteFiles(body.documents);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendResponse(
        res,
        400,
        false,
        `${
          field === "vinNumber" ? "VIN number" : "License plate number"
        } already exists`
      );
    }
    sendResponse(res, 400, false, error.message);
  }
};

// ================= GET ALL VEHICLES =================
exports.getVehicles = async (req, res) => {
  try {
   const {
  page = 1,
  limit = 10,
  brand,
  category,
  minPrice,
  maxPrice,
  search,
  isActive,
  zone,
} = req.query;
;

    const query = {};

    // Build filters
    if (brand) query.brand = parseObjectIdArray(brand);
    if (category) query.category = { $in: parseObjectIdArray(category) };
    if (isActive !== undefined) query.isActive = isActive === "true";
    if (zone) query.zone = zone;

    // Price range filter
    if (minPrice || maxPrice) {
      query.$or = [
        { "pricing.hourly": {} },
        { "pricing.perDay": {} },
        { "pricing.distanceWise": {} },
      ];
      if (minPrice) {
        const min = Number(minPrice);
        query.$or.forEach((priceQuery) => {
          const key = Object.keys(priceQuery)[0];
          priceQuery[key].$gte = min;
        });
      }
      if (maxPrice) {
        const max = Number(maxPrice);
        query.$or.forEach((priceQuery) => {
          const key = Object.keys(priceQuery)[0];
          priceQuery[key].$lte = max;
        });
      }
    }

    // Search functionality
    if (search) {
      const keywordRegex = new RegExp(search, "i");
    query.$or = [
  { name: keywordRegex },
  { description: keywordRegex },
  { model: keywordRegex },
  { searchTags: { $in: [keywordRegex] } },
];

    }

    const skip = (Number(page) - 1) * Number(limit);

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .populate("brand")
        .populate({
          path: "category",
          model: "Category",
          select: "title image isActive subCategories",
        })
        .populate(populateProvider)
        .populate("zone")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Vehicle.countDocuments(query),
    ]);

    // Manually populate subcategories for each vehicle
    for (let vehicle of vehicles) {
      if (vehicle.category && vehicle.subCategories?.length) {
        const subCategoryIds = vehicle.subCategories.map((id) => id.toString());

        const categorySubs = Array.isArray(vehicle.category?.subCategories)
          ? vehicle.category.subCategories
          : [];

        vehicle.subCategories = categorySubs
          .filter((sub) => subCategoryIds.includes(sub._id.toString()))
          .map((sub) => ({
            _id: sub._id,
            title: sub.title,
            image: sub.image,
            isActive: sub.isActive,
          }));

        delete vehicle.category.subCategories;
      }
    }

    const meta = {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
    for (let vehicle of vehicles) {
      attachVehicleImageUrls(vehicle);
    }
    for (let vehicle of vehicles) {
      attachVehicleImageUrls(vehicle);
      await populateSubCategories(vehicle);
    }
    sendResponse(
      res,
      200,
      true,
      "Vehicles retrieved successfully",
      vehicles,
      meta
    );
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= GET SINGLE VEHICLE =================
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive subCategories",
      })
      .populate(populateProvider)
      .populate("zone")
      .lean();

    if (!vehicle) {
      return sendResponse(res, 404, false, "Vehicle not found");
    }
    attachVehicleImageUrls(vehicle);
    await populateSubCategories(vehicle);

    // Manually populate subcategories
    if (vehicle.category && vehicle.subCategories?.length) {
      const subCategoryIds = vehicle.subCategories.map((id) => id.toString());

      const categorySubs = Array.isArray(vehicle.category?.subCategories)
        ? vehicle.category.subCategories
        : [];

      vehicle.subCategories = categorySubs
        .filter((sub) => subCategoryIds.includes(sub._id.toString()))
        .map((sub) => ({
          _id: sub._id,
          title: sub.title,
          image: sub.image,
          isActive: sub.isActive,
        }));

      delete vehicle.category.subCategories;
    }

    sendResponse(res, 200, true, "Vehicle retrieved successfully", vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= GET VEHICLES BY PROVIDER =================
exports.getVehiclesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10, isActive } = req.query;

    const query = { provider: providerId };
    if (isActive !== undefined) query.isActive = isActive === "true";

    const skip = (Number(page) - 1) * Number(limit);

    const [vehicles, total] = await Promise.all([
      Vehicle.find(query)
        .populate("brand")
        .populate({
          path: "category",
          model: "Category",
          select: "title image isActive",
        })
        .populate(populateProvider)
        .populate("zone")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      Vehicle.countDocuments(query),
    ]);

    // ✅ FIX: process each vehicle correctly
    for (let vehicle of vehicles) {
      attachVehicleImageUrls(vehicle);
      await populateSubCategories(vehicle);
    }

    const meta = {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };

    sendResponse(
      res,
      200,
      true,
      "Provider vehicles retrieved successfully",
      vehicles,
      meta
    );
  } catch (error) {
    console.error("Error fetching provider vehicles:", error);
    sendResponse(res, 500, false, error.message);
  }
};



/* =====================================================
   GET VENDORS FOR VEHICLE MODULE (LIKE CAKES)
===================================================== */

exports.getVendorsForVehicleModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const providerId = req.query.providerId || req.query.providerid || null;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return sendResponse(res, 400, false, "Invalid module ID");
    }

    // Vendor profiles filtered by module
    let query = { module: moduleId };
    if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
      query.user = providerId;
    }

    const vendorProfiles = await VendorProfile.find(query)
      .select("user storeName logo coverImage")
      .lean();

    if (!vendorProfiles.length) {
      return res.json({
        success: true,
        message: providerId
          ? "Vendor not found for this module"
          : "No vendors found for this module",
        data: providerId ? null : [],
      });
    }

    const vendorIds = vendorProfiles.map(v => v.user);

    // Fetch user info
    const users = await User.find({ _id: { $in: vendorIds } })
      .select("firstName lastName email phone profilePhoto")
      .lean();

    // Fetch subscriptions
    const subscriptions = await Subscription.find({
      userId: { $in: vendorIds },
      isCurrent: true,
    })
      .populate("planId")
      .populate("moduleId", "title icon")
      .lean();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

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
        ? Math.max(0, Math.ceil((sub.endDate - now) / (1000 * 60 * 60 * 24)))
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
        hasVendorProfile: true,
        subscription: sub
          ? {
              isSubscribed: sub.status === "active",
              status: sub.status,
              plan: sub.planId,
              module: sub.moduleId,
              billing: {
                startDate: sub.startDate,
                endDate: sub.endDate,
                autoRenew: sub.autoRenew,
              },
              access: {
                canAccess: sub.status === "active" && !isExpired,
                isExpired,
                daysLeft,
              },
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
                daysLeft: 0,
              },
            },
      };
    });

    // SINGLE vendor
    if (providerId) {
      return res.json({
        success: true,
        message: "Vendor details fetched successfully",
        data: final[0] || null,
      });
    }

    // ALL vendors
    return res.json({
      success: true,
      message: "Vendors fetched successfully",
      count: final.length,
      data: final,
    });
  } catch (error) {
    console.error("GET VEHICLE VENDORS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE VEHICLE =================
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return sendResponse(res, 404, false, "Vehicle not found");
    }

    // Authorization check
    if (
      req.user.role === "vendor" &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(
        res,
        403,
        false,
        "Unauthorized to update this vehicle"
      );
    }

    const body = sanitizeVehicleData(req.body);

    // Track old files for cleanup
    const filesToDelete = [];

    // Handle new file uploads
    if (req.files?.images) {
      if (vehicle.images?.length) filesToDelete.push(...vehicle.images);
      body.images = req.files.images.map((f) => f.filename);
    }
    if (req.files?.thumbnail?.[0]) {
      if (vehicle.thumbnail) filesToDelete.push(vehicle.thumbnail);
      body.thumbnail = req.files.thumbnail[0].filename;
    }
    if (req.files?.documents) {
      if (vehicle.documents?.length) filesToDelete.push(...vehicle.documents);
      body.documents = req.files.documents.map((f) => f.filename);
    }

    // Verify brand if changed
    if (body.brand && body.brand !== vehicle.brand?.toString()) {
      if (!mongoose.Types.ObjectId.isValid(body.brand)) {
        return sendResponse(res, 400, false, "Invalid brand ID");
      }
      const existingBrand = await mongoose
        .model("Brand")
        .findById(body.brand)
        .select("_id");
      if (!existingBrand) {
        return sendResponse(res, 400, false, "Brand does not exist");
      }
    }

    // Validate subcategories if being updated
    if (body.subCategories?.length && body.category) {
      const parentCategory = await Category.findById(body.category).lean();

      if (parentCategory) {
        const validSubIds = Array.isArray(parentCategory.subCategories)
          ? parentCategory.subCategories
              .filter((sub) => sub.isActive)
              .map((s) => s._id.toString())
          : [];

        body.subCategories = body.subCategories.filter((id) =>
          validSubIds.includes(id.toString())
        );
      }
    }

    // Update vehicle
    Object.assign(vehicle, body);
    await vehicle.save();

    // Cleanup old files
    if (filesToDelete.length) await deleteFiles(filesToDelete);

    // Populate and return updated vehicle
    const updatedVehicle = await Vehicle.findById(vehicle._id)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive subCategories",
      })
      .populate(populateProvider)
      .populate("zone")
      .lean();

    // Manually populate subcategories
    if (updatedVehicle.category && updatedVehicle.subCategories?.length) {
      const subCategoryIds = updatedVehicle.subCategories.map((id) =>
        id.toString()
      );

      updatedVehicle.subCategories = updatedVehicle.category.subCategories
        .filter((sub) => subCategoryIds.includes(sub._id.toString()))
        .map((sub) => ({
          _id: sub._id,
          title: sub.title,
          image: sub.image,
          isActive: sub.isActive,
        }));

      delete updatedVehicle.category.subCategories;
    }

    sendResponse(
      res,
      200,
      true,
      "Vehicle updated successfully",
      updatedVehicle
    );
  } catch (error) {
    console.error("Error updating vehicle:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return sendResponse(
        res,
        400,
        false,
        `${
          field === "vinNumber" ? "VIN number" : "License plate number"
        } already exists`
      );
    }
    sendResponse(res, 500, false, error.message);
  }
};

// ================= DELETE VEHICLE =================
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return sendResponse(res, 404, false, "Vehicle not found");
    }

    // Authorization check
    if (
      req.user.role === "vendor" &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(
        res,
        403,
        false,
        "Unauthorized to delete this vehicle"
      );
    }

    // Collect all files to delete
    const filesToDelete = [
      ...(vehicle.images || []),
      ...(vehicle.documents || []),
    ];
    if (vehicle.thumbnail) filesToDelete.push(vehicle.thumbnail);

    // Delete vehicle
    await vehicle.deleteOne();

    // Cleanup files
    if (filesToDelete.length) await deleteFiles(filesToDelete);

    sendResponse(res, 200, true, "Vehicle deleted successfully");
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= BLOCK VEHICLE =================
exports.blockVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return sendResponse(res, 404, false, "Vehicle not found");
    }

    // Authorization check
    if (
      req.user.role === "vendor" &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(
        res,
        403,
        false,
        "Unauthorized to block this vehicle"
      );
    }

    vehicle.isActive = false;
    await vehicle.save();

    // Populate before sending response
    const blockedVehicle = await Vehicle.findById(vehicle._id)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    sendResponse(
      res,
      200,
      true,
      "Vehicle blocked successfully",
      blockedVehicle
    );
  } catch (error) {
    console.error("Error blocking vehicle:", error);
    sendResponse(res, 500, false, error.message);
  }
};

// ================= REACTIVATE VEHICLE =================
exports.reactivateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return sendResponse(res, 404, false, "Vehicle not found");
    }

    // Authorization check
    if (
      req.user.role === "vendor" &&
      vehicle.provider.toString() !== req.user._id.toString()
    ) {
      return sendResponse(
        res,
        403,
        false,
        "Unauthorized to reactivate this vehicle"
      );
    }

    vehicle.isActive = true;
    await vehicle.save();

    // Populate before sending response
    const reactivatedVehicle = await Vehicle.findById(vehicle._id)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    sendResponse(
      res,
      200,
      true,
      "Vehicle reactivated successfully",
      reactivatedVehicle
    );
  } catch (error) {
    console.error("Error reactivating vehicle:", error);
    sendResponse(res, 500, false, error.message);
  }
};

// Advanced Filter Vehicles API
// Fixed Advanced Filter Vehicles API
exports.filterVehicles = async (req, res) => {
  try {
    const {
  latitude,
  longitude,
  radius = 10,
  brandId,
  categoryId,
  seatingCapacityRange,
  minSeatingCapacity,
  maxSeatingCapacity,
  airCondition,
  minPrice,
  maxPrice,
  minRating,
  maxRating,
  page = 1,
  limit = 50,
  sortBy = "createdAt",
  sortOrder = "desc",
} = req.query;

    console.log("=== FILTER REQUEST ===");
    console.log("minPrice:", minPrice, typeof minPrice);
    console.log("maxPrice:", maxPrice, typeof maxPrice);

    // Validate and parse seatingCapacityRange
    let capacityFilter = null;
    if (
      seatingCapacityRange &&
      minSeatingCapacity === undefined &&
      maxSeatingCapacity === undefined
    ) {
      const decodedCapacityRange = decodeURIComponent(seatingCapacityRange);

      let min, max;
      if (decodedCapacityRange.endsWith("+")) {
        min = parseInt(decodedCapacityRange.replace("+", ""));
        if (isNaN(min) || min < 0) {
          return sendResponse(res, 400, false, "Invalid seatingCapacityRange");
        }
      } else if (decodedCapacityRange.includes("-")) {
        [min, max] = decodedCapacityRange
          .split("-")
          .map((num) => parseInt(num));
        if (isNaN(min) || isNaN(max) || min < 0 || max < 0 || min > max) {
          return sendResponse(res, 400, false, "Invalid seatingCapacityRange");
        }
      } else {
        return sendResponse(
          res,
          400,
          false,
          "Invalid seatingCapacityRange format"
        );
      }

      capacityFilter = { min, max };
    }

    // Build base query
    const query = { isActive: true };
// ===== FEATURE FILTERS =====
if (req.query.driverIncluded !== undefined) {
  query["features.driverIncluded"] = req.query.driverIncluded === "true";
}

if (req.query.sunroof !== undefined) {
  query["features.sunroof"] = req.query.sunroof === "true";
}

if (req.query.decorationAvailable !== undefined) {
  query["features.decorationAvailable"] =
    req.query.decorationAvailable === "true";
}

    // Apply capacity range filter
    if (capacityFilter) {
      if (capacityFilter.min !== undefined) {
        query.seatingCapacity = {
          ...query.seatingCapacity,
          $gte: capacityFilter.min,
        };
      }
      if (capacityFilter.max !== undefined) {
        query.seatingCapacity = {
          ...query.seatingCapacity,
          $lte: capacityFilter.max,
        };
      }
    }

    // Manual capacity filters
    if (minSeatingCapacity !== undefined && !seatingCapacityRange) {
      const min = parseInt(minSeatingCapacity);
      if (!isNaN(min)) {
        query.seatingCapacity = { ...query.seatingCapacity, $gte: min };
      }
    }
    if (maxSeatingCapacity !== undefined && !seatingCapacityRange) {
      const max = parseInt(maxSeatingCapacity);
      if (!isNaN(max)) {
        query.seatingCapacity = { ...query.seatingCapacity, $lte: max };
      }
    }

    // Brand filter
    if (brandId) {
      let brandIds = parseObjectIdArray(brandId);
      if (brandIds.length > 0) {
        query.brand = { $in: brandIds };
      }
    }

    // Category filter
    if (categoryId) {
      let categoryIds = parseObjectIdArray(categoryId);
      if (categoryIds.length > 0) {
        query.category = { $in: categoryIds };
      }
    }

  

    // Fuel type filter
    

    // Rating filter
    if (minRating !== undefined) {
      const min = parseFloat(minRating);
      if (!isNaN(min)) {
        query.rating = { ...query.rating, $gte: min };
      }
    }
    if (maxRating !== undefined) {
      const max = parseFloat(maxRating);
      if (!isNaN(max)) {
        query.rating = { ...query.rating, $lte: max };
      }
    }

    // Location filter setup
    let useLocationFilter = false;
    let userLat, userLon, searchRadius;

    if (latitude && longitude) {
      userLat = parseFloat(latitude);
      userLon = parseFloat(longitude);
      searchRadius = parseFloat(radius);

      if (isNaN(userLat) || isNaN(userLon)) {
        return sendResponse(
          res,
          400,
          false,
          "Invalid latitude or longitude values"
        );
      }

      if (isNaN(searchRadius) || searchRadius <= 0) {
        searchRadius = 10;
      }

      useLocationFilter = true;
      query.latitude = { $exists: true, $ne: null };
      query.longitude = { $exists: true, $ne: null };
    }

    console.log("MongoDB Query:", JSON.stringify(query, null, 2));

    // Fetch vehicles
    let vehicles = await Vehicle.find(query)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    console.log(`Found ${vehicles.length} vehicles from database`);

    // Calculate distance
    if (useLocationFilter) {
      vehicles = vehicles
        .map((vehicle) => {
          const distance = calculateDistance(
            userLat,
            userLon,
            vehicle.latitude,
            vehicle.longitude
          );
          return {
            ...vehicle,
            distance: parseFloat(distance.toFixed(2)),
            distanceUnit: "km",
          };
        })
        .filter((vehicle) => vehicle.distance <= searchRadius);

      console.log(`${vehicles.length} vehicles after location filter`);
    }

    // Add calculated fields - IMPORTANT: Calculate effective price for ALL vehicles
    vehicles = vehicles.map((vehicle) => {
      const effectivePrice = getEffectivePrice(vehicle.pricing);
      const capacity = Number(vehicle.seatingCapacity) || 0;

      // Debug log for first few vehicles
      if (vehicles.indexOf(vehicle) < 3) {
        console.log(`Vehicle: ${vehicle.name}`);
        console.log(`  Pricing:`, vehicle.pricing);
        console.log(`  Effective Price:`, effectivePrice);
      }

      return {
        ...vehicle,
        effectivePrice,
        totalCapacity: capacity,
      };
    });

    // ===== CRITICAL: PRICE FILTER =====
    if (minPrice !== undefined || maxPrice !== undefined) {
      const beforePriceFilter = vehicles.length;

      vehicles = vehicles.filter((vehicle) => {
        const price = vehicle.effectivePrice;

        // Log for debugging
        console.log(`Checking vehicle: ${vehicle.name}, Price: ${price}`);

        // IMPORTANT: If price is 0 or null, exclude it
        if (!price || price <= 0) {
          console.log(`  ❌ Excluded (no valid price)`);
          return false;
        }

        let meetsMinPrice = true;
        let meetsMaxPrice = true;

        if (minPrice !== undefined) {
          const min = parseFloat(minPrice);
          if (!isNaN(min)) {
            meetsMinPrice = price >= min;
            if (!meetsMinPrice) {
              console.log(`  ❌ Below minPrice (${price} < ${min})`);
            }
          }
        }

        if (maxPrice !== undefined) {
          const max = parseFloat(maxPrice);
          if (!isNaN(max)) {
            meetsMaxPrice = price <= max;
            if (!meetsMaxPrice) {
              console.log(`  ❌ Above maxPrice (${price} > ${max})`);
            }
          }
        }

        const result = meetsMinPrice && meetsMaxPrice;
        if (result) {
          console.log(`  ✅ Included (${price} in range)`);
        }

        return result;
      });

      console.log(`\n=== PRICE FILTER SUMMARY ===`);
      console.log(`Before: ${beforePriceFilter} vehicles`);
      console.log(`After: ${vehicles.length} vehicles`);
      console.log(`Range: ${minPrice || "any"} - ${maxPrice || "any"}`);
    }

    // Sorting
    const sortField = sortBy.toLowerCase();
    const order = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    vehicles.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "price":
          aValue = a.effectivePrice || 0;
          bValue = b.effectivePrice || 0;
          break;
        case "rating":
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case "capacity":
          aValue = a.totalCapacity || 0;
          bValue = b.totalCapacity || 0;
          break;
        case "distance":
          if (useLocationFilter) {
            aValue = a.distance || 0;
            bValue = b.distance || 0;
          } else {
            aValue = 0;
            bValue = 0;
          }
          break;
        case "createdat":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      return (aValue - bValue) * order;
    });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedVehicles = vehicles.slice(skip, skip + parseInt(limit));
    const totalResults = vehicles.length;
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Total matching vehicles: ${totalResults}`);
    console.log(`Returning page ${page}: ${paginatedVehicles.length} vehicles`);

    // Build response with applied filters summary
    const appliedFilters = {
      location: useLocationFilter
        ? {
            latitude: userLat,
            longitude: userLon,
            radius: searchRadius,
            unit: "km",
          }
        : null,
      brandId: brandId || null,
      categoryId: categoryId || null,
    
      seatingCapacityRange: seatingCapacityRange || null,
      capacity: {
        min: minSeatingCapacity || null,
        max: maxSeatingCapacity || null,
      },
      airCondition:
        airCondition !== undefined
          ? airCondition === "true" || airCondition === true
          : null,
      price: {
        min: minPrice || null,
        max: maxPrice || null,
      },
      rating: {
        min: minRating || null,
        max: maxRating || null,
      },
      sorting: {
        sortBy: sortField,
        sortOrder,
      },
    };

    sendResponse(
      res,
      200,
      true,
      paginatedVehicles.length === 0
        ? "No vehicles found matching your filter criteria"
        : "Vehicles filtered successfully",
      paginatedVehicles,
      {
        count: paginatedVehicles.length,
        totalResults,
        page: parseInt(page),
        totalPages,
        appliedFilters,
      }
    );
  } catch (err) {
    console.error("❌ Error in filterVehicles:", err);
    console.error("Stack:", err.stack);
    sendResponse(res, 500, false, `Failed to filter vehicles: ${err.message}`);
  }
};

// Advanced Vehicle Search API
exports.searchVehicles = async (req, res) => {
  try {
    const {
      keyword,
      latitude,
      longitude,
      radius = 10,
      limit = 50,
      page = 1,
      categoryId,
    } = req.query;

    // Build search query
    const searchQuery = { isActive: true };

    // Keyword search (searches in multiple fields)
    if (keyword && keyword.trim()) {
      const keywordRegex = new RegExp(keyword.trim(), "i");
      searchQuery.$or = [
        { name: keywordRegex },
        { description: keywordRegex },
        { model: keywordRegex },
        { searchTags: { $in: [keywordRegex] } },
      ];
    }

    // Category filter
    if (categoryId) {
      let categoryIds = parseObjectIdArray(categoryId);
      if (categoryIds.length > 0) {
        searchQuery.category = { $in: categoryIds };
      } else {
        return sendResponse(res, 400, false, "Invalid category ID");
      }
    }

    // Location filter
    let useLocationFilter = false;
    let userLat, userLon, searchRadius;

    if (latitude && longitude) {
      userLat = parseFloat(latitude);
      userLon = parseFloat(longitude);
      searchRadius = parseFloat(radius);

      if (isNaN(userLat) || isNaN(userLon)) {
        return sendResponse(
          res,
          400,
          false,
          "Invalid latitude or longitude values"
        );
      }

      if (isNaN(searchRadius) || searchRadius <= 0) {
        searchRadius = 10; // Default 10km
      }

      useLocationFilter = true;
      searchQuery.latitude = { $exists: true, $ne: null };
      searchQuery.longitude = { $exists: true, $ne: null };
    }

    // Fetch vehicles
    let vehicles = await Vehicle.find(searchQuery)
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    // Apply location filtering and calculate distances
    if (useLocationFilter) {
      vehicles = vehicles
        .map((vehicle) => {
          const distance = calculateDistance(
            userLat,
            userLon,
            vehicle.latitude,
            vehicle.longitude
          );
          return {
            ...vehicle,
            distance: parseFloat(distance.toFixed(2)),
            distanceUnit: "km",
          };
        })
        .filter((vehicle) => vehicle.distance <= searchRadius);

      // Sort by distance
      vehicles.sort((a, b) => a.distance - b.distance);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedVehicles = vehicles.slice(skip, skip + parseInt(limit));
    const totalResults = vehicles.length;
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    const response = {
      success: true,
      count: paginatedVehicles.length,
      totalResults,
      page: parseInt(page),
      totalPages,
      searchParams: {
        keyword: keyword || null,
        latitude: useLocationFilter ? userLat : null,
        longitude: useLocationFilter ? userLon : null,
        radius: useLocationFilter ? searchRadius : null,
        categoryId: categoryId || null,
      },
      data: paginatedVehicles,
      message:
        paginatedVehicles.length === 0
          ? "No vehicles found matching your search criteria"
          : "Vehicles fetched successfully",
    };

    res.status(200).json(response);
  } catch (err) {
    console.error("Error in searchVehicles:", err);
    sendResponse(res, 500, false, "Failed to search vehicles");
  }
};

// Get vehicles by location
exports.getVehiclesByLocation = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return sendResponse(
        res,
        400,
        false,
        "Latitude (lat) and Longitude (lng) are required"
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid latitude or longitude values"
      );
    }

    const zoneRadiusKm = 10;

    const vehicles = await Vehicle.find({
      latitude: { $exists: true, $ne: null },
      longitude: { $exists: true, $ne: null },
      isActive: true,
    })
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    const vehiclesInZone = [];

    vehicles.forEach((vehicle) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        vehicle.latitude,
        vehicle.longitude
      );

      if (distance <= zoneRadiusKm) {
        vehiclesInZone.push({
          ...vehicle,
          distance: parseFloat(distance.toFixed(2)),
          distanceUnit: "km",
        });
      }
    });

    vehiclesInZone.sort((a, b) => a.distance - b.distance);

    sendResponse(
      res,
      200,
      true,
      vehiclesInZone.length === 0
        ? `No vehicles found within ${zoneRadiusKm}km zone`
        : "Vehicles in zone fetched successfully",
      vehiclesInZone,
      {
        count: vehiclesInZone.length,
        searchParams: {
          latitude,
          longitude,
          zoneRadius: zoneRadiusKm,
          unit: "km",
        },
      }
    );
  } catch (err) {
    console.error("Error fetching vehicles by location:", err);
    sendResponse(res, 500, false, "Failed to fetch vehicles by location");
  }
};

// Get vehicles by category
exports.getVehiclesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return sendResponse(res, 400, false, "Invalid category ID");
    }

    const vehicles = await Vehicle.find({
      category: categoryId,
      isActive: true,
    })
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .sort({ createdAt: -1 })
      .lean();

    sendResponse(
      res,
      200,
      true,
      vehicles.length === 0
        ? "No vehicles found for this category"
        : "Vehicles fetched successfully",
      vehicles,
      { count: vehicles.length }
    );
  } catch (err) {
    console.error("Error fetching vehicles by category:", err);
    sendResponse(res, 500, false, "Failed to fetch vehicles by category");
  }
};

// Sort Vehicles
exports.sortVehicles = async (req, res) => {
  try {
    const { sortBy, latitude, longitude } = req.query;
    const validSortOptions = [
      "highPrice",
      "lowPrice",
      "topRated",
      "lowRated",
      "highCapacity",
      "lowCapacity",
      "mostBooked",
      "newest",
    ];

    if (!sortBy || !validSortOptions.includes(sortBy)) {
      return sendResponse(
        res,
        400,
        false,
        "Invalid or missing sortBy parameter. Use: highPrice, lowPrice, topRated, lowRated, highCapacity, lowCapacity, mostBooked, newest"
      );
    }

    let vehicles = await Vehicle.find({ isActive: true })
      .populate("brand")
      .populate({
        path: "category",
        model: "Category",
        select: "title image isActive",
      })
      .populate({
        path: "subCategories",
        model: "Category",
        select: "title image isActive",
      })

      .populate(populateProvider)
      .populate("zone")
      .lean();

    let useLocationFilter = false;
    let userLat,
      userLon,
      searchRadius = 10;

    if (latitude && longitude) {
      userLat = parseFloat(latitude);
      userLon = parseFloat(longitude);

      if (isNaN(userLat) || isNaN(userLon)) {
        return sendResponse(
          res,
          400,
          false,
          "Invalid latitude or longitude values"
        );
      }

      useLocationFilter = true;
      vehicles = vehicles
        .map((vehicle) => {
          const distance = calculateDistance(
            userLat,
            userLon,
            vehicle.latitude,
            vehicle.longitude
          );
          return {
            ...vehicle,
            distance: parseFloat(distance.toFixed(2)),
            distanceUnit: "km",
          };
        })
        .filter((vehicle) => vehicle.distance <= searchRadius);
    }

    const vehiclesWithData = vehicles.map((vehicle) => {
      const effectivePrice = getEffectivePrice(vehicle.pricing);
      const rating = Number(vehicle.rating) || 0;
      const capacity = Number(vehicle.seatingCapacity) || 0;
      const popularity = Number(vehicle.totalTrips) || 0;

      return { ...vehicle, effectivePrice, rating, capacity, popularity };
    });

    let sortedVehicles;
    switch (sortBy) {
      case "highPrice":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => b.effectivePrice - a.effectivePrice
        );
        break;
      case "lowPrice":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => a.effectivePrice - b.effectivePrice
        );
        break;
      case "topRated":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => b.rating - a.rating
        );
        break;
      case "lowRated":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => a.rating - b.rating
        );
        break;
      case "highCapacity":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => b.capacity - a.capacity
        );
        break;
      case "lowCapacity":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => a.capacity - b.capacity
        );
        break;
      case "mostBooked":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => b.popularity - a.popularity
        );
        break;
      case "newest":
        sortedVehicles = [...vehiclesWithData].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        break;
      default:
        sortedVehicles = vehiclesWithData;
    }

    sendResponse(
      res,
      200,
      true,
      "Vehicles sorted successfully",
      sortedVehicles,
      {
        count: sortedVehicles.length,
        sortBy: sortBy,
        searchParams: useLocationFilter
          ? {
              latitude: userLat,
              longitude: userLon,
              radius: searchRadius,
              unit: "km",
            }
          : null,
      }
    );
  } catch (err) {
    console.error("Error in sortVehicles:", err);
    sendResponse(res, 500, false, "Failed to sort vehicles");
  }
};

// Vehicle Counts
exports.getVehicleCounts = async (req, res) => {
  try {
    const total = await Vehicle.countDocuments();
    const active = await Vehicle.countDocuments({ isActive: true });
    const inactive = await Vehicle.countDocuments({ isActive: false });

    sendResponse(res, 200, true, "Vehicle counts fetched successfully", {
      total,
      active,
      inactive,
    });
  } catch (err) {
    console.error("Error in getVehicleCounts:", err);
    sendResponse(res, 500, false, "Failed to fetch vehicle counts");
  }
};
