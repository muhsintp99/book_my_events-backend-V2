const Ornament = require("../../models/vendor/ornamentPackageModel");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");
const Category = require("../../models/admin/category");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const { enhanceProviderDetails } = require("../../utils/providerHelper");

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

const generateOrnamentId = () => {
    return `ORN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

const sendResponse = (res, status, success, message, data = null, meta = null) => {
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
    mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;

/* =====================================================
   SANITIZE BODY
===================================================== */

const sanitizeOrnamentData = (body) => {
    const data = { ...body };

    if (data.name) data.name = data.name.trim();
    if (data.description) data.description = data.description.trim();

    data.isActive = data.isActive !== undefined ? String(data.isActive) === "true" : true;

    // Pricing & Stock
    data.weight = Number(data.weight || 0);

    // Buy Pricing
    const bp = parseJSON(data.buyPricing, {});
    let buyTotal = Number(bp.unitPrice || 0);
    const discountVal = Number(bp.discountValue || 0);
    if (bp.discountType === "flat") {
        buyTotal = Math.max(0, buyTotal - discountVal);
    } else if (bp.discountType === "percentage") {
        buyTotal = Math.max(0, buyTotal - (buyTotal * discountVal) / 100);
    }
    // Add tax
    const taxPercent = Number(bp.tax || 0);
    buyTotal = buyTotal + (buyTotal * taxPercent) / 100;

    data.buyPricing = {
        unitPrice: Number(bp.unitPrice || 0),
        discountType: bp.discountType || "none",
        discountValue: discountVal,
        tax: taxPercent,
        totalPrice: buyTotal,
    };

    // Rental Pricing
    const rp = parseJSON(data.rentalPricing, {});
    data.rentalPricing = {
        pricePerDay: Number(rp.pricePerDay || 0),
        minimumDays: Number(rp.minimumDays || 1),
        lateCharges: Number(rp.lateCharges || 0),
        totalPrice: Number(rp.totalPrice || rp.pricePerDay || 0),
        advanceForBooking: Number(rp.advanceForBooking || 0),
        damagePolicy: rp.damagePolicy || "",
    };

    // Stock
    const stockData = parseJSON(data.stock, {});
    data.stock = {
        quantity: Number(stockData.quantity || 0),
        lowStockAlert: Number(stockData.lowStockAlert || 0),
    };

    // Shipping
    // Shipping (Cake-style with Takeaway + Map)
    const shippingData = parseJSON(data.shipping, {});
    data.shipping = {
        freeShipping: String(shippingData.freeShipping) === "true",
        flatRateShipping: String(shippingData.flatRateShipping) === "true",
        takeaway: String(shippingData.takeaway) === "true",
        takeawayLocation: shippingData.takeawayLocation || "",
        pickupLatitude: shippingData.pickupLatitude || "",
        pickupLongitude: shippingData.pickupLongitude || "",
        shippingPrice: Number(shippingData.shippingPrice || 0),
    };


    // Features (nested object with arrays - like UI structure)
    data.occasions = parseJSON(data.occasions, []);

    const featuresData = parseJSON(data.features, {});
    data.features = {
        basicFeatures: Array.isArray(featuresData.basicFeatures)
            ? featuresData.basicFeatures
            : parseJSON(data.basicFeatures, []),
        suitableFor: Array.isArray(featuresData.suitableFor)
            ? featuresData.suitableFor
            : parseJSON(data.suitableFor, []),
        style: Array.isArray(featuresData.style)
            ? featuresData.style
            : parseJSON(data.style, []),
    };

    data.tags = parseJSON(data.tags, []);
    data.termsAndConditions = parseJSON(data.termsAndConditions, []);

    // Collections
    data.collections = parseJSON(data.collections, []);
    if (Array.isArray(data.collections)) {
        data.collections = data.collections.filter((c) =>
            ["For Men", "For Women", "For Bride", "For Groom", "For Kids"].includes(c)
        );
    }

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
    data.relatedItems.linkByRef = data.relatedItems.linkBy === "product" ? "Ornament" : "Category";

    // IDs
    if (data.module) data.module = parseObjectId(data.module);
    if (data.category) data.category = parseObjectId(data.category);
    if (data.subCategory) data.subCategory = parseObjectId(data.subCategory);
    if (data.provider) data.provider = parseObjectId(data.provider);

    return data;
};

/* =====================================================
   POPULATE ORNAMENT HELPER
===================================================== */

const populateOrnament = async (id, req = null) => {
    const baseUrl = req
        ? `${req.protocol}://${req.get("host")}`
        : "https://api.bookmyevent.ae";

    let ornament = await Ornament.findById(id)
        .populate("module", "title icon description")
        .populate("category", "title image description")
        .populate("subCategory", "title image")
        .populate("provider", "firstName lastName email phone profilePhoto")
        .populate("relatedItems.items")
        .lean();

    if (!ornament) return null;

    // Normalize image paths
    if (ornament.thumbnail) {
        ornament.thumbnail = ornament.thumbnail.startsWith("http")
            ? ornament.thumbnail
            : `${baseUrl}${normalizeUploadPath(ornament.thumbnail)}`;
    }

    if (ornament.galleryImages && ornament.galleryImages.length > 0) {
        ornament.galleryImages = ornament.galleryImages.map((img) =>
            img.startsWith("http") ? img : `${baseUrl}${normalizeUploadPath(img)}`
        );
    }

    // Related items normalization
    if (ornament.relatedItems?.items?.length > 0) {
        ornament.relatedItems.items = ornament.relatedItems.items.map((item) => {
            if (!item || typeof item === "string") return item;
            if (item.thumbnail) item.thumbnail = item.thumbnail.startsWith("http") ? item.thumbnail : `${baseUrl}${normalizeUploadPath(item.thumbnail)}`;
            if (item.image) item.image = item.image.startsWith("http") ? item.image : `${baseUrl}${normalizeUploadPath(item.image)}`;

            // Ensure BOTH name and title are available for frontend consistency
            if (item.title && !item.name) item.name = item.title;
            if (item.name && !item.title) item.title = item.name;

            return item;
        });
    }

    // Standardize provider details
    if (ornament.provider) {
        ornament.provider = await enhanceProviderDetails(ornament.provider, req);
    } else {
        ornament.provider = await enhanceProviderDetails(null, req);
    }

    return ornament;
};

/* =====================================================
   CONTROLLER METHODS
===================================================== */

exports.createOrnament = async (req, res) => {
    try {
        const body = sanitizeOrnamentData(req.body);

        if (!body.module || !body.category) {
            return sendResponse(res, 400, false, "Module and Category are required");
        }

        if (!body.provider && req.user) {
            body.provider = req.user._id;
        }

        if (!req.files?.thumbnail?.[0]) {
            return sendResponse(res, 400, false, "Thumbnail is required");
        }

        body.thumbnail = normalizeUploadPath(req.files.thumbnail[0].path);
        body.galleryImages = req.files?.galleryImages?.map((f) => normalizeUploadPath(f.path)) || [];
        body.ornamentId = generateOrnamentId();

        const ornament = await Ornament.create(body);
        const populated = await populateOrnament(ornament._id, req);

        sendResponse(res, 201, true, "Ornament created successfully", populated);
    } catch (error) {
        console.error("CREATE ORNAMENT ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.getAllOrnaments = async (req, res) => {
    try {
        const { search, category, module, provider, collection } = req.query;
        let query = {};

        if (search) query.$text = { $search: search };
        if (category && mongoose.Types.ObjectId.isValid(category)) query.category = category;
        if (module && mongoose.Types.ObjectId.isValid(module)) query.module = module;
        if (provider && mongoose.Types.ObjectId.isValid(provider)) query.provider = provider;

        // Support both 'collections' field and 'features.suitableFor' field
        if (collection) {
            // Normalize the collection parameter: "For Women" -> "women"
            const normalizedCollection = collection.replace(/^For\s+/i, '').toLowerCase();

            // Query both the collections array AND the features.suitableFor array
            query.$or = [
                { collections: collection }, // Check exact match in collections array
                { "features.suitableFor": normalizedCollection } // Check normalized match in suitableFor
            ];
        }

        const ornaments = await Ornament.find(query).sort({ isTopPick: -1, createdAt: -1 });
        const final = await Promise.all(ornaments.map((o) => populateOrnament(o._id, req)));

        sendResponse(res, 200, true, "Ornaments fetched successfully", final, { count: final.length });
    } catch (error) {
        console.error("GET ALL ORNAMENTS ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.getOrnamentsByProvider = async (req, res) => {
    try {
        const { providerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(providerId)) {
            return sendResponse(res, 400, false, "Invalid provider ID");
        }

        const ornaments = await Ornament.find({
            provider: providerId,
            isActive: true
        }).sort({ createdAt: -1 });

        const final = await Promise.all(
            ornaments.map(o => populateOrnament(o._id, req))
        );

        return sendResponse(
            res,
            200,
            true,
            "Provider ornaments fetched successfully",
            final,
            { count: final.length }
        );
    } catch (error) {
        console.error("GET ORNAMENTS BY PROVIDER ERROR:", error);
        return sendResponse(res, 500, false, error.message);
    }
};


exports.getOrnamentById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendResponse(res, 400, false, "Invalid ornament ID");
        }
        const ornament = await populateOrnament(req.params.id, req);
        if (!ornament) return sendResponse(res, 404, false, "Ornament not found");
        sendResponse(res, 200, true, "Ornament fetched successfully", ornament);
    } catch (error) {
        console.error("GET ORNAMENT BY ID ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.updateOrnament = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid ID");

        const body = sanitizeOrnamentData(req.body);
        const existing = await Ornament.findById(id);
        if (!existing) return sendResponse(res, 404, false, "Ornament not found");

        if (req.files?.thumbnail?.[0]) {
            body.thumbnail = normalizeUploadPath(req.files.thumbnail[0].path);
        }
        if (req.files?.galleryImages?.length > 0) {
            body.galleryImages = req.files.galleryImages.map((f) => normalizeUploadPath(f.path));
        }

        const updated = await Ornament.findByIdAndUpdate(id, body, { new: true });
        const populated = await populateOrnament(updated._id, req);

        sendResponse(res, 200, true, "Ornament updated successfully", populated);
    } catch (error) {
        console.error("UPDATE ORNAMENT ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.deleteOrnament = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid ID");

        const deleted = await Ornament.findByIdAndDelete(id);
        if (!deleted) return sendResponse(res, 404, false, "Ornament not found");

        sendResponse(res, 200, true, "Ornament deleted successfully");
    } catch (error) {
        console.error("DELETE ORNAMENT ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

// ----------------------------- GET VENDORS FOR ORNAMENT MODULE (SINGLE + ALL) -----------------------------
exports.getVendorsForOrnamentModule = async (req, res) => {
    try {
        const { moduleId } = req.params;

        // Support both providerId & providerid
        const providerId = req.query.providerId || req.query.providerid || null;

        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return sendResponse(res, 400, false, "Invalid module ID");
        }

        // Base query
        let query = { module: moduleId };

        // If providerId passed -> fetch only that vendor
        if (providerId && mongoose.Types.ObjectId.isValid(providerId)) {
            query.user = providerId;
        }

        // Fetch VendorProfiles
        const vendorProfiles = await VendorProfile.find(query)
            .select("user storeName logo coverImage")
            .lean();

        if (!vendorProfiles.length) {
            return sendResponse(res, 200, true, "Vendor not found for this module", providerId ? null : []);
        }

        const vendorIds = vendorProfiles.map((vp) => vp.user);

        // Fetch Users
        const users = await User.find({ _id: { $in: vendorIds } })
            .select("firstName lastName email phone profilePhoto")
            .lean();

        // Merge User + VendorProfile
        const final = await Promise.all(
            users.map(async (u) => {
                return await enhanceProviderDetails(u, req);
            })
        );

        // If providerId -> return SINGLE vendor
        if (providerId) {
            return sendResponse(res, 200, true, "Vendor fetched successfully", final[0] || null);
        }

        // Else -> return ALL vendors
        return sendResponse(res, 200, true, "Vendors fetched successfully", final, { count: final.length });
    } catch (err) {
        console.error("❌ Get Ornament Vendors Error:", err);
        return sendResponse(res, 500, false, err.message);
    }
};

exports.getOrnamentVendors = async (req, res) => {
    try {
        // Find the Ornament module first
        const Module = require("../../models/admin/module");
        const ornamentModule = await Module.findOne({ title: /ornament/i });

        if (!ornamentModule) {
            return sendResponse(res, 404, false, "Ornament module not found");
        }

        const vendorProfiles = await VendorProfile.find({ module: ornamentModule._id })
            .select("user storeName logo coverImage")
            .lean();

        if (!vendorProfiles.length) {
            return sendResponse(res, 200, true, "No vendors found for Ornament module", []);
        }

        const vendorIds = vendorProfiles.map((vp) => vp.user);

        const users = await User.find({ _id: { $in: vendorIds } })
            .select("firstName lastName email phone profilePhoto")
            .lean();

        const final = await Promise.all(
            users.map(async (u) => {
                return await enhanceProviderDetails(u, req);
            })
        );

        return sendResponse(res, 200, true, "Ornament vendors fetched successfully", final, { count: final.length });
    } catch (err) {
        console.error("❌ Get All Ornament Vendors Error:", err);
        return sendResponse(res, 500, false, err.message);
    }
};

// ----------------------------- GET PACKAGES BY PROVIDER -----------------------------
exports.getOrnamentPackagesByProvider = async (req, res) => {
    try {
        const { providerId } = req.params;
        const { moduleId } = req.query;

        if (!mongoose.Types.ObjectId.isValid(providerId)) {
            return sendResponse(res, 400, false, "Invalid provider ID");
        }

        const query = { provider: providerId };
        if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) query.module = moduleId;

        const ornaments = await Ornament.find(query)
            .populate("module", "title")
            .populate("category", "title image")
            .populate("provider", "firstName lastName email phone")
            .sort({ isTopPick: -1, createdAt: -1 });

        const final = await Promise.all(ornaments.map((o) => populateOrnament(o._id, req)));

        return sendResponse(res, 200, true, "Provider packages fetched successfully", final, { count: final.length });
    } catch (err) {
        console.error("❌ Get Provider Packages Error:", err);
        return sendResponse(res, 500, false, err.message);
    }
};

// ----------------------------- TOGGLE ACTIVE -----------------------------
exports.toggleActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid ID");

        const pkg = await Ornament.findById(id);
        if (!pkg) return sendResponse(res, 404, false, "Not found");

        pkg.isActive = !pkg.isActive;
        await pkg.save();

        return sendResponse(res, 200, true, `Ornament ${pkg.isActive ? "activated" : "deactivated"}`, pkg);
    } catch (err) {
        console.error("❌ Toggle Active Error:", err);
        return sendResponse(res, 500, false, err.message);
    }
};

// ----------------------------- TOGGLE TOP PICK -----------------------------
exports.toggleTopPickStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid ID");

        const pkg = await Ornament.findById(id);
        if (!pkg) return sendResponse(res, 404, false, "Not found");

        pkg.isTopPick = !pkg.isTopPick;
        await pkg.save();

        return sendResponse(res, 200, true, `Top pick ${pkg.isTopPick ? "enabled" : "disabled"}`, pkg);
    } catch (err) {
        console.error("❌ Toggle TopPick Error:", err);
        return sendResponse(res, 500, false, err.message);
    }
};

// ----------------------------- GET COLLECTIONS (For Men, For Women, etc) -----------------------------
exports.getCollections = async (req, res) => {
    try {
        const { collection } = req.query;
        const suitableForOptions = ["men", "women", "kids", "bride", "groom"];
        const displayNames = {
            men: "For Men",
            women: "For Women",
            kids: "For Kids",
            bride: "For Bride",
            groom: "For Groom"
        };

        const optionsToFetch = collection && suitableForOptions.includes(collection)
            ? [collection]
            : suitableForOptions;

        const collectionData = await Promise.all(
            optionsToFetch.map(async (opt) => {
                const packages = await Ornament.find({
                    "features.suitableFor": opt,
                    isActive: true,
                }).sort({ isTopPick: -1, createdAt: -1 }).lean();

                const populatedPackages = await Promise.all(
                    packages.map((pkg) => populateOrnament(pkg._id, req))
                );

                return {
                    name: displayNames[opt],
                    slug: opt,
                    count: populatedPackages.length,
                    icon: `collection-${opt}`,
                    packages: populatedPackages,
                };
            })
        );

        sendResponse(res, 200, true, "Collections fetched successfully", collectionData);
    } catch (error) {
        console.error("GET COLLECTIONS ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

// ----------------------------- GET CATEGORIES -----------------------------
exports.getCategories = async (req, res) => {
    try {
        const { moduleId } = req.query;
        let moduleFilter = {};

        if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
            moduleFilter = { module: moduleId };
        } else {
            // Find the Ornament module first
            const Module = require("../../models/admin/module");
            const ornamentModule = await Module.findOne({ title: /ornament/i });
            if (ornamentModule) {
                moduleFilter = { module: ornamentModule._id };
            }
        }

        const categories = await Category.find({
            ...moduleFilter,
            parentCategory: null,
            isActive: true
        }).lean();

        const finalCategories = await Promise.all(
            categories.map(async (cat) => {
                const subCats = await Category.find({
                    parentCategory: cat._id,
                    isActive: true
                }).lean();

                const packageCount = await Ornament.countDocuments({
                    category: cat._id,
                    isActive: true
                });

                return {
                    ...cat,
                    subCategories: subCats,
                    packageCount
                };
            })
        );

        sendResponse(res, 200, true, "Categories fetched successfully", finalCategories);
    } catch (error) {
        console.error("GET CATEGORIES ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

// ----------------------------- GET OCCASIONS -----------------------------
exports.getOccasions = async (req, res) => {
    try {
        const occasions = await Ornament.distinct("occasions", { isActive: true });
        const occasionData = await Promise.all(
            occasions.map(async (occ) => {
                const packages = await Ornament.find({
                    occasions: occ,
                    isActive: true
                }).sort({ isTopPick: -1, createdAt: -1 }).limit(10);

                const populated = await Promise.all(
                    packages.map(p => populateOrnament(p._id, req))
                );

                return {
                    name: occ,
                    count: await Ornament.countDocuments({ occasions: occ, isActive: true }),
                    packages: populated
                };
            })
        );

        sendResponse(res, 200, true, "Occasions fetched successfully", occasionData);
    } catch (error) {
        console.error("GET OCCASIONS ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

/* =====================================================
   BULK UPDATE - ADD COLLECTIONS TO EXISTING ORNAMENTS
===================================================== */

exports.bulkAddCollections = async (req, res) => {
    try {
        const { collection } = req.body;

        if (!collection || !["For Men", "For Women", "For Bride", "For Groom", "For Kids"].includes(collection)) {
            return sendResponse(res, 400, false, "Invalid collection. Must be one of: For Men, For Women, For Bride, For Groom, For Kids");
        }

        // Update all ornaments that don't have collections yet
        const result = await Ornament.updateMany(
            { collections: { $exists: false } },
            { $set: { collections: [collection] } }
        );

        sendResponse(res, 200, true, `Updated ${result.modifiedCount} ornaments with collection: ${collection}`, {
            modifiedCount: result.modifiedCount,
            matchedCount: result.matchedCount,
        });
    } catch (error) {
        console.error("BULK UPDATE COLLECTIONS ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.addCollectionToOrnament = async (req, res) => {
    try {
        const { id } = req.params;
        const { collection } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendResponse(res, 400, false, "Invalid ornament ID");
        }

        if (!collection || !["For Men", "For Women", "For Bride", "For Groom", "For Kids"].includes(collection)) {
            return sendResponse(res, 400, false, "Invalid collection");
        }

        const ornament = await Ornament.findById(id);
        if (!ornament) {
            return sendResponse(res, 404, false, "Ornament not found");
        }

        // Add collection if it doesn't exist
        if (!ornament.collections.includes(collection)) {
            ornament.collections.push(collection);
            await ornament.save();
        }

        const populated = await populateOrnament(ornament._id, req);
        sendResponse(res, 200, true, `Collection '${collection}' added to ornament`, populated);
    } catch (error) {
        console.error("ADD COLLECTION ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};