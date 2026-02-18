const Cake = require("../../models/vendor/cakePackageModel");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const Category = require("../../models/admin/category");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const Subscription = require("../../models/admin/Subscription");

/* =====================================================
   HELPERS
===================================================== */

const normalizeUploadPath = (filePath) => {
  if (!filePath) return filePath;
  let normalized = filePath.replace(/\\/g, "/");
  const index = normalized.toLowerCase().indexOf("/uploads");
  if (index !== -1) {
    return normalized.substring(index);
  }
  if (normalized.toLowerCase().startsWith("uploads")) {
    return "/" + normalized;
  }
  return normalized;
};

const generateCakeId = () => {
  return `CAKE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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

const deleteFiles = async (files = []) => {
  if (!files.length) return;
  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.unlink(path.resolve(file));
      } catch (err) {
        if (err.code !== "ENOENT") console.error("Delete error:", err);
      }
    })
  );
};

const parseJSON = (value, fallback) => {
  if (!value) return fallback;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

const parseObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

/* =====================================================
   SANITIZE BODY
===================================================== */

const sanitizeCakeData = (body) => {
  const data = { ...body };

  // =========================
  // BASIC STRINGS
  // =========================
  if (data.name) data.name = data.name.trim();
  if (data.shortDescription)
    data.shortDescription = data.shortDescription.trim();

  // =========================
  // BOOLEAN FLAGS
  // =========================
  data.isActive =
    data.isActive !== undefined ? String(data.isActive) === "true" : true;

  data.isTopPick =
    data.isTopPick !== undefined ? String(data.isTopPick) === "true" : false;

  // =========================
  // ITEM TYPE (Egg / Eggless)
  // =========================
  if (data.itemType) {
    const normalized = String(data.itemType).toLowerCase();
    if (normalized === "eggless") data.itemType = "Eggless";
    else if (normalized === "egg") data.itemType = "Egg";
  }

  // =========================
  // NEW FIELDS (UOM, Weight, PrepTime)
  // =========================
  if (data.uom) data.uom = data.uom.trim();
  if (data.weight) data.weight = Number(data.weight);
  if (data.prepTime) data.prepTime = data.prepTime.trim();

  // =========================
  // PRICING & DISCOUNTS
  // =========================
  data.basePrice = Number(data.basePrice || 0);
  data.discountValue = Number(data.discountValue || 0);
  data.discountType = data.discountType || "none";

  // Calculate Final Price
  let final = data.basePrice;
  if (data.discountType === "flat") {
    final = Math.max(0, data.basePrice - data.discountValue);
  } else if (data.discountType === "percentage") {
    const discount = (data.basePrice * data.discountValue) / 100;
    final = Math.max(0, data.basePrice - discount);
  }
  data.finalPrice = final;

  // =========================
  // OBJECT IDS
  // =========================
  if (data.module) data.module = parseObjectId(data.module);
  if (data.category) data.category = parseObjectId(data.category);
  if (data.provider) data.provider = parseObjectId(data.provider);

  if (data.subCategories) {
    data.subCategories = parseJSON(data.subCategories, []).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
  }

  // =========================
  // ARRAYS / JSON FIELDS
  // =========================
  data.nutrition = parseJSON(data.nutrition, []);
  data.allergenIngredients = parseJSON(data.allergenIngredients, []);
  data.searchTags = parseJSON(data.searchTags, []);
  data.variations = parseJSON(data.variations, []);
  data.occasions = parseJSON(data.occasions, []);
  data.attributes = parseJSON(data.attributes, []);
  data.termsAndConditions = parseJSON(data.termsAndConditions, []);

  // Use new Addon system (Item selection support)
  data.addons = parseJSON(data.addons, []).map((item) => {
    if (typeof item === "string" && mongoose.Types.ObjectId.isValid(item)) {
      return { addonId: new mongoose.Types.ObjectId(item), selectedItems: [] };
    }
    if (typeof item === "object" && item.addonId) {
      return {
        addonId: new mongoose.Types.ObjectId(item.addonId),
        selectedItems: Array.isArray(item.selectedItems)
          ? item.selectedItems
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id))
          : [],
      };
    }
    return null;
  }).filter(Boolean);

  if (data.addonTemplate && mongoose.Types.ObjectId.isValid(data.addonTemplate)) {
    data.addonTemplate = new mongoose.Types.ObjectId(data.addonTemplate);
  }

  // Shipping - read from root body if sent individually by frontend
  const shippingData = parseJSON(data.shipping, {});
  data.shipping = {
    homeDelivery: data.homeDelivery !== undefined ? String(data.homeDelivery) === "true" : (shippingData.homeDelivery !== undefined ? String(shippingData.homeDelivery) === "true" : true),
    free: String(shippingData.free) === "true",
    flatRate: String(shippingData.flatRate) === "true",
    takeaway: data.takeaway !== undefined ? String(data.takeaway) === "true" : (shippingData.takeaway !== undefined ? String(shippingData.takeaway) === "true" : false),
    takeawayLocation: shippingData.takeawayLocation || "",
    pickupLatitude: shippingData.pickupLatitude || "",
    pickupLongitude: shippingData.pickupLongitude || "",
    deliveryRadius: Number(shippingData.deliveryRadius || 26),
    price: Number(shippingData.price || 0),
  };

  // Related Items
  data.relatedItems = parseJSON(data.relatedItems, {
    linkBy: "category",
    items: [],
  });

  if (Array.isArray(data.relatedItems.items)) {
    data.relatedItems.items = data.relatedItems.items
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
  }

  if (data.relatedItems.linkBy === "product") {
    data.relatedItems.linkByRef = "Cake";
  } else {
    data.relatedItems.linkByRef = "Category";
  }

  // Delivery Mode - No longer restricted to enum so custom modes work
  if (!data.deliveryMode) {
    data.deliveryMode = 'standard';
  }

  return data;
};



/* =====================================================
   POPULATE CAKE HELPER
===================================================== */

const populateCake = async (id, req = null) => {
  const baseUrl = req
    ? `${req.protocol}://${req.get("host")}`
    : "http://api.bookmyevent.ae";

  let cake = await Cake.findById(id)
    .populate("module", "title icon description")
    .populate("category", "title image description")
    .populate("subCategories", "title image")
    .populate("provider", "firstName lastName email phone profilePhoto")
    .populate("relatedItems.items")
    .populate({
      path: "addons.addonId",
      select: "title description icon priceList isActive",
    })
    .populate({
      path: "addonTemplate",
      populate: {
        path: "addonGroups",
        select: "title description icon priceList isActive",
      },
    })
    .lean();

  // Logic for Dynamic Templates in Cake Packages
  if (cake.addonTemplate?.isDynamic && cake.provider) {
    const CakeAddon = mongoose.model("CakeAddon");
    const allAddons = await CakeAddon.find({
      provider: cake.provider._id || cake.provider,
      isActive: true,
    }).select("title description icon priceList isActive");

    // Manually formatting paths for dynamic addons
    cake.addonTemplate.addonGroups = allAddons.map((addon) => {
      const a = addon.toObject ? addon.toObject() : addon;
      if (a.icon) {
        const baseUrl = `${req.protocol}://${req.get("host")}`;
        a.icon = a.icon.startsWith("http")
          ? a.icon
          : `${baseUrl}${a.icon.startsWith("/uploads") ? a.icon : "/uploads/cake-addons/" + a.icon}`;
      }
      return a;
    });
  }


  if (!cake) return null;

  // Process manual addons to only show selected items
  if (cake.addons && cake.addons.length > 0) {
    cake.addons = cake.addons.map((addon) => {
      const group = addon.addonId;
      if (!group) return null;

      // If selectedItems is provided, filter the group's priceList
      if (addon.selectedItems && addon.selectedItems.length > 0) {
        const itemIds = addon.selectedItems.map((id) => id.toString());
        group.priceList = group.priceList.filter((item) =>
          itemIds.includes(item._id.toString())
        );
      }

      // Format icon path if needed
      if (group.icon && !group.icon.startsWith("http")) {
        group.icon = `${baseUrl}${normalizeUploadPath(group.icon)}`;
      }

      // Simplify structure: Move group data up
      return {
        ...group,
        addonId: group._id, // Keep ID for reference
      };
    }).filter(Boolean);
  }

  // Normalize image paths for cake
  if (cake.thumbnail) {
    cake.thumbnail = cake.thumbnail.startsWith("http")
      ? cake.thumbnail
      : `${baseUrl}${normalizeUploadPath(cake.thumbnail)}`;
  }

  if (cake.images && cake.images.length > 0) {
    cake.images = cake.images.map((img) =>
      img.startsWith("http") ? img : `${baseUrl}${normalizeUploadPath(img)}`
    );
  }

  if (cake.variations && cake.variations.length > 0) {
    cake.variations = cake.variations.map((v) => {
      if (v.image) {
        v.image = v.image.startsWith("http")
          ? v.image
          : `${baseUrl}${normalizeUploadPath(v.image)}`;
      }
      return v;
    });
  }

  // Normalize and Robustly Populate Related Items
  if (cake.relatedItems?.items?.length > 0) {
    const rawItems = cake.relatedItems.items;
    const currentRef = cake.relatedItems.linkByRef || (cake.relatedItems.linkBy === "product" ? "Cake" : "Category");

    // 1. Identify items that failed to populate (still IDs)
    const unpopulatedIds = rawItems.filter((i) => typeof i === "string" || i instanceof mongoose.Types.ObjectId);

    if (unpopulatedIds.length > 0) {
      // 2. Try fetching from both collections to be safe, using explicit models
      const CakeModel = mongoose.model("Cake");
      const CategoryModel = mongoose.model("Category");

      const [cakesResult, categoriesResult] = await Promise.all([
        CakeModel.find({ _id: { $in: unpopulatedIds } }).lean(),
        CategoryModel.find({ _id: { $in: unpopulatedIds } }).lean()
      ]);

      const allPopulated = [...cakesResult, ...categoriesResult];

      // 3. Merge them back into the list
      cake.relatedItems.items = rawItems.map((item) => {
        const id = (item._id || item || "").toString();
        const found = allPopulated.find((a) => a._id.toString() === id);
        return found || item;
      });
    }

    // 4. Final normalization for all successfully populated items
    cake.relatedItems.items = cake.relatedItems.items.map((item) => {
      if (!item || typeof item === "string" || item instanceof mongoose.Types.ObjectId) return item;

      // Handle both Cakes (thumbnail) and Categories (image)
      if (item.thumbnail) {
        item.thumbnail = item.thumbnail.startsWith("http")
          ? item.thumbnail
          : `${baseUrl}${normalizeUploadPath(item.thumbnail)}`;
      }

      if (item.image) {
        item.image = item.image.startsWith("http")
          ? item.image
          : `${baseUrl}${normalizeUploadPath(item.image)}`;
      }

      if (item.images && Array.isArray(item.images)) {
        item.images = item.images.map(img =>
          img.startsWith("http") ? img : `${baseUrl}${normalizeUploadPath(img)}`
        );
      }

      // Ensure BOTH name and title are available for frontend consistency
      if (item.title && !item.name) item.name = item.title;
      if (item.name && !item.title) item.title = item.name;

      // ✅ Remove unnecessary nested fields to prevent double listing and heavy response
      delete item.relatedItems;
      delete item.addons;
      delete item.variations;
      delete item.billingSummary;
      delete item.priceInfo;

      return item;
    });
  }

  // Protect when provider is missing
  if (!cake.provider) {
    cake.provider = {
      _id: null,
      firstName: null,
      lastName: null,
      email: null,
      phone: null,
      profilePhoto: null,
      storeName: null,
      logo: null,
      coverImage: null,
      hasVendorProfile: false,
    };
    return cake;
  }

  // Fetch VendorProfile linked to provider
  const vendorProfile = await VendorProfile.findOne({ user: cake.provider._id })
    .select("storeName logo coverImage latitude longitude zone")
    .lean();

  if (vendorProfile) {
    cake.provider.storeName = vendorProfile.storeName;
    cake.provider.latitude = vendorProfile.latitude;
    cake.provider.longitude = vendorProfile.longitude;
    cake.provider.vendor_zone = vendorProfile.zone;
    cake.provider.logo = vendorProfile.logo
      ? `${baseUrl}${vendorProfile.logo}`
      : null;
    cake.provider.coverImage = vendorProfile.coverImage
      ? `${baseUrl}${vendorProfile.coverImage}`
      : null;
    cake.provider.hasVendorProfile = true;

    // ✅ If cake shipping coords are missing, auto-fill from vendor profile
    if (!cake.shipping.pickupLatitude || !cake.shipping.pickupLongitude) {
      cake.shipping.pickupLatitude = vendorProfile.latitude;
      cake.shipping.pickupLongitude = vendorProfile.longitude;
    }
  } else {
    cake.provider.storeName = `${cake.provider.firstName || ""} ${cake.provider.lastName || ""
      }`.trim();
    cake.provider.logo = cake.provider.profilePhoto
      ? cake.provider.profilePhoto.startsWith("http")
        ? cake.provider.profilePhoto
        : `${baseUrl}${cake.provider.profilePhoto}`
      : null;
    cake.provider.coverImage = null;
    cake.provider.hasVendorProfile = false;
  }

  return cake;
};

/* =====================================================
   CREATE CAKE
===================================================== */

exports.createCake = async (req, res) => {
  const body = sanitizeCakeData(req.body);

  try {
    if (!body.module) {
      return sendResponse(res, 400, false, "Module is required");
    }

    if (!mongoose.Types.ObjectId.isValid(body.module)) {
      return sendResponse(res, 400, false, "Invalid module ID");
    }
    if (!body.category) {
      return sendResponse(res, 400, false, "Category is required");
    }

    const categoryExists = await Category.findById(body.category);
    if (!categoryExists) {
      return sendResponse(res, 400, false, "Invalid category");
    }

    // Provider - use from body if provided, otherwise from req.user
    if (!body.provider && req.user) {
      body.provider = req.user._id;
    }

    if (!body.provider) {
      return sendResponse(res, 400, false, "Provider is required");
    }

    // ✅ Requirement #3: Validate deliveryMode against vendor's enabled modes
    const vendorProfile = await VendorProfile.findOne({ user: body.provider });
    if (vendorProfile && vendorProfile.deliveryProfile) {
      const enabledModes = vendorProfile.deliveryProfile.deliveryConfigurations
        ?.filter(c => c.status)
        .map(c => c.mode) || [];

      if (!enabledModes.includes(body.deliveryMode || 'standard')) {
        return sendResponse(res, 400, false, `Selected delivery mode '${body.deliveryMode || 'standard'}' is not enabled in your delivery profile.`);
      }
    }

    // Files
    if (!req.files?.thumbnail?.[0]) {
      return sendResponse(res, 400, false, "Thumbnail is required");
    }

    body.thumbnail = normalizeUploadPath(req.files.thumbnail[0].path);
    body.images = req.files?.images?.map((f) => normalizeUploadPath(f.path)) || [];

    // ✅ Variation Images mapping
    if (req.files?.variationImages && body.variations?.length) {
      body.variations = body.variations.map((v) => {
        if (v.image && typeof v.image === "string" && v.image.startsWith("VAR_FILE_")) {
          const idx = parseInt(v.image.replace("VAR_FILE_", ""));
          if (req.files.variationImages[idx]) {
            v.image = normalizeUploadPath(req.files.variationImages[idx].path);
          }
        } else if (v.image) {
          v.image = normalizeUploadPath(v.image);
        }
        return v;
      });
    }

    body.cakeId = generateCakeId();

    const cake = await Cake.create(body);

    // ✅ Populate the full cake with all details
    const populatedCake = await populateCake(cake._id, req);

    sendResponse(res, 201, true, "Cake created successfully", populatedCake);
  } catch (error) {
    if (body.images) await deleteFiles(body.images);
    if (body.thumbnail) await deleteFiles([body.thumbnail]);

    console.error("CREATE CAKE ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   GET ALL CAKES
===================================================== */

exports.getAllCakes = async (req, res) => {
  try {
    const { search, category, module } = req.query;

    let query = {};

    if (search && search.trim()) query.$text = { $search: search };
    if (category && mongoose.Types.ObjectId.isValid(category))
      query.category = category;
    if (module && mongoose.Types.ObjectId.isValid(module))
      query.module = module;

    const cakes = await Cake.find(query).sort({ isTopPick: -1, createdAt: -1 });

    const final = await Promise.all(cakes.map((c) => populateCake(c._id, req)));

    sendResponse(res, 200, true, "Cakes fetched successfully", final, {
      count: final.length,
    });
  } catch (error) {
    console.error("GET ALL CAKES ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   GET SINGLE CAKE
===================================================== */

exports.getCakeById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return sendResponse(res, 400, false, "Invalid cake ID");
    }

    const cake = await populateCake(req.params.id, req);

    if (!cake) {
      return sendResponse(res, 404, false, "Cake not found");
    }

    sendResponse(res, 200, true, "Cake fetched successfully", cake);
  } catch (error) {
    console.error("GET CAKE BY ID ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   GET CAKES BY PROVIDER
===================================================== */

exports.getCakesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 10, isActive, category, moduleId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return sendResponse(res, 400, false, "Invalid provider ID");
    }

    const query = { provider: providerId };
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.category = category;
    }
    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      query.module = moduleId;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [cakes, total] = await Promise.all([
      Cake.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      Cake.countDocuments(query),
    ]);

    const final = await Promise.all(cakes.map((c) => populateCake(c._id, req)));

    sendResponse(res, 200, true, "Provider cakes fetched successfully", final, {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("GET CAKES BY PROVIDER ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   GET CAKES BY MODULE
===================================================== */

exports.getCakesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return sendResponse(res, 400, false, "Invalid module ID");
    }

    const query = { module: moduleId, isActive: true };

    const validSortFields = {
      createdAt: "createdAt",
      name: "name",
    };


    const sortField = validSortFields[sortBy] || "createdAt";
    const order = sortOrder === "asc" ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [cakes, total] = await Promise.all([
      Cake.find(query)
        .sort({ [sortField]: order })
        .skip(skip)
        .limit(Number(limit)),
      Cake.countDocuments(query),
    ]);

    const final = await Promise.all(cakes.map((c) => populateCake(c._id, req)));

    sendResponse(
      res,
      200,
      true,
      "Cakes fetched by module successfully",
      final,
      {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      }
    );
  } catch (error) {
    console.error("GET CAKES BY MODULE ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   GET CAKES BY CATEGORY
===================================================== */

exports.getCakesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return sendResponse(res, 400, false, "Invalid category ID");
    }

    const query = { category: categoryId, isActive: true };

    const validSortFields = {
      createdAt: "createdAt",
      name: "name",
    };


    const sortField = validSortFields[sortBy] || "createdAt";
    const order = sortOrder === "asc" ? 1 : -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [cakes, total] = await Promise.all([
      Cake.find(query)
        .sort({ [sortField]: order })
        .skip(skip)
        .limit(Number(limit)),
      Cake.countDocuments(query),
    ]);

    const final = await Promise.all(cakes.map((c) => populateCake(c._id, req)));

    sendResponse(
      res,
      200,
      true,
      "Cakes fetched by category successfully",
      final,
      {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      }
    );
  } catch (error) {
    console.error("GET CAKES BY CATEGORY ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   GET VENDORS FOR CAKE MODULE (EXACT SAME AS MAKEUP)
===================================================== */

exports.getVendorsForCakeModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const providerId = req.query.providerId || req.query.providerid || null;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return sendResponse(res, 400, false, "Invalid module ID");
    }

    let query = { module: moduleId };
    if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
      query.user = providerId;
    }

    const vendorProfiles = await VendorProfile.find(query)
      .select("user storeName logo coverImage subscriptionStatus isFreeTrial")
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

    const vendorIds = vendorProfiles.map((v) => v.user);

    // ✅ COUNT CAKES PER VENDOR using aggregation
    const cakeCounts = await Cake.aggregate([
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
      isCurrent: true,
    })
      .populate("planId")
      .populate("moduleId", "title icon")
      .lean();

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const final = users.map((u) => {
      const vp = vendorProfiles.find(
        (v) => v.user.toString() === u._id.toString()
      );
      const sub = subscriptions.find(
        (s) => s.userId.toString() === u._id.toString()
      );

      // ✅ GET CAKE COUNT FOR THIS VENDOR
      const cakeCount = cakeCounts.find(c => c._id.toString() === u._id.toString());
      const packageCount = cakeCount ? cakeCount.count : 0;

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

    // ✅ SINGLE VENDOR (don't filter for single vendor query)
    if (providerId) {
      return res.json({
        success: true,
        message: "Vendor details fetched successfully",
        data: final[0] || null,
      });
    }

    // ✅ FILTER OUT VENDORS WITH ZERO PACKAGES
    const filtered = final.filter(v => v.packageCount > 0);

    // ✅ ALL VENDORS (only those with packages)
    return res.json({
      success: true,
      message: "Vendors fetched successfully",
      count: filtered.length,
      data: filtered,
    });
  } catch (err) {
    console.error("GET VENDORS FOR CAKE MODULE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   LIST CAKE VENDORS (Alternative simplified endpoint)
===================================================== */

exports.listCakeVendors = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return sendResponse(res, 400, false, "Invalid module ID");
    }

    const vendorProfiles = await VendorProfile.find({ module: moduleId })
      .populate({
        path: "user",
        select: "firstName lastName email phone role",
      })
      .select("storeName logo coverImage module user");

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const formatted = vendorProfiles.map((v) => ({
      _id: v.user?._id,
      firstName: v.user?.firstName,
      lastName: v.user?.lastName,
      email: v.user?.email,
      phone: v.user?.phone,
      storeName: v.storeName,
      logo: v.logo ? `${baseUrl}${v.logo}` : null,
      coverImage: v.coverImage ? `${baseUrl}${v.coverImage}` : null,
      vendorProfileId: v._id,
      module: v.module,
    }));

    res.status(200).json({
      success: true,
      message: "Cake vendors fetched successfully",
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    console.error("LIST CAKE VENDORS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cake vendors",
      error: err.message,
    });
  }
};

/* =====================================================
   TOGGLE TOP PICK STATUS
===================================================== */

exports.toggleTopPickStatus = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) {
      return sendResponse(res, 404, false, "Cake not found");
    }

    // Vendor authorization (if applicable)
    if (
      req.user?.role === "vendor" &&
      cake.provider?.toString() !== req.user._id.toString()
    ) {
      return sendResponse(res, 403, false, "Unauthorized to modify this cake");
    }

    cake.isTopPick = !cake.isTopPick;
    await cake.save();

    const populated = await populateCake(cake._id, req);

    sendResponse(
      res,
      200,
      true,
      `Cake ${cake.isTopPick ? "marked as Top Pick" : "removed from Top Pick"}`,
      populated
    );
  } catch (error) {
    console.error("TOGGLE TOP PICK ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   GET TOP PICK CAKES
===================================================== */

exports.getTopPickCakes = async (req, res) => {
  try {
    const cakes = await Cake.find({ isTopPick: true, isActive: true }).sort({
      createdAt: -1,
    });

    const final = await Promise.all(cakes.map((c) => populateCake(c._id, req)));

    sendResponse(res, 200, true, "Top pick cakes fetched successfully", final, {
      count: final.length,
    });
  } catch (error) {
    console.error("GET TOP PICK CAKES ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   TOGGLE ACTIVE STATUS
===================================================== */

exports.toggleActiveStatus = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) {
      return sendResponse(res, 404, false, "Cake not found");
    }

    // Vendor authorization (if applicable)
    if (
      req.user?.role === "vendor" &&
      cake.provider?.toString() !== req.user._id.toString()
    ) {
      return sendResponse(res, 403, false, "Unauthorized to modify this cake");
    }

    cake.isActive = !cake.isActive;
    await cake.save();

    const populated = await populateCake(cake._id, req);

    sendResponse(
      res,
      200,
      true,
      `Cake ${cake.isActive ? "activated" : "deactivated"}`,
      populated
    );
  } catch (error) {
    console.error("TOGGLE ACTIVE STATUS ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   SEARCH CAKES
===================================================== */

exports.searchCakes = async (req, res) => {
  try {
    const {
      keyword,
      categoryId,
      moduleId,
      providerId,
      minPrice,
      maxPrice,
      itemType,
      isHalal,
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
        { name: regex },
        { shortDescription: regex },
        { searchTags: regex },
      ];
    }

    // Module filter
    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      query.module = moduleId;
    }

    // Category filter
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      query.category = categoryId;
    }

    // Provider filter
    if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
      query.provider = providerId;
    }

    // Item type filter (Veg/Non-Veg)
    if (itemType && ["Veg", "Non-Veg"].includes(itemType)) {
      query.itemType = itemType;
    }

    // Halal filter
    // if (isHalal !== undefined) {
    //   query.isHalal = isHalal === "true";
    // }



    const validSortFields = {
      createdAt: "createdAt",
      name: "name",
    };


    const sortField = validSortFields[sortBy] || "createdAt";
    const order = sortOrder === "asc" ? 1 : -1;

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Query execution
    const [cakes, total] = await Promise.all([
      Cake.find(query)
        .sort({ [sortField]: order })
        .skip(skip)
        .limit(Number(limit)),
      Cake.countDocuments(query),
    ]);

    const final = await Promise.all(cakes.map((c) => populateCake(c._id, req)));

    res.json({
      success: true,
      message: "Cakes searched successfully",
      count: final.length,
      totalResults: total,
      totalPages: Math.ceil(total / Number(limit)),
      page: Number(page),
      data: final,
    });
  } catch (err) {
    console.error("SEARCH CAKES ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   UPDATE CAKE
===================================================== */

exports.updateCake = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) {
      return sendResponse(res, 404, false, "Cake not found");
    }

    // Vendor authorization
    if (
      req.user?.role === "vendor" &&
      cake.provider?.toString() !== req.user._id.toString()
    ) {
      return sendResponse(res, 403, false, "Unauthorized to update this cake");
    }

    const body = sanitizeCakeData(req.body);

    // ✅ Requirement #3: Validate deliveryMode against vendor's enabled modes
    if (body.deliveryMode) {
      const vendorProfile = await VendorProfile.findOne({ user: cake.provider });
      if (vendorProfile && vendorProfile.deliveryProfile) {
        const enabledModes = vendorProfile.deliveryProfile.deliveryConfigurations
          ?.filter(c => c.status)
          .map(c => c.mode) || [];

        if (!enabledModes.includes(body.deliveryMode)) {
          return sendResponse(res, 400, false, `Selected delivery mode '${body.deliveryMode}' is not enabled in your delivery profile.`);
        }
      }
    }

    const filesToDelete = [];

    if (req.files?.thumbnail?.[0]) {
      if (cake.thumbnail) filesToDelete.push(cake.thumbnail);
      body.thumbnail = normalizeUploadPath(req.files.thumbnail[0].path);
    }

    if (req.files?.images) {
      if (cake.images?.length) filesToDelete.push(...cake.images);
      body.images = req.files.images.map((f) => normalizeUploadPath(f.path));
    }

    // ✅ Variation Images mapping
    if (req.files?.variationImages && body.variations?.length) {
      body.variations = body.variations.map((v) => {
        if (v.image && typeof v.image === "string" && v.image.startsWith("VAR_FILE_")) {
          const idx = parseInt(v.image.replace("VAR_FILE_", ""));
          if (req.files.variationImages[idx]) {
            v.image = normalizeUploadPath(req.files.variationImages[idx].path);
          }
        } else if (v.image) {
          v.image = normalizeUploadPath(v.image);
        }
        return v;
      });
    }

    // =========================
    // SAFE PRICE INFO MERGE
    // =========================

    Object.assign(cake, body);




    await cake.save();


    if (filesToDelete.length) await deleteFiles(filesToDelete);

    const updatedCake = await populateCake(cake._id, req);

    sendResponse(res, 200, true, "Cake updated successfully", updatedCake);
  } catch (error) {
    console.error("UPDATE CAKE ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};

/* =====================================================
   DELETE CAKE
================================= */

exports.deleteCake = async (req, res) => {
  try {
    const cake = await Cake.findById(req.params.id);
    if (!cake) {
      return sendResponse(res, 404, false, "Cake not found");
    }

    // Vendor authorization
    if (
      req.user?.role === "vendor" &&
      cake.provider?.toString() !== req.user._id.toString()
    ) {
      return sendResponse(res, 403, false, "Unauthorized to delete this cake");
    }

    const filesToDelete = [];
    if (cake.thumbnail) filesToDelete.push(cake.thumbnail);
    if (cake.images?.length) filesToDelete.push(...cake.images);

    await cake.deleteOne();
    if (filesToDelete.length) await deleteFiles(filesToDelete);

    sendResponse(res, 200, true, "Cake deleted successfully");
  } catch (error) {
    console.error("DELETE CAKE ERROR:", error);
    sendResponse(res, 500, false, error.message);
  }
};
