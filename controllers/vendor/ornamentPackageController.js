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
    const shippingData = parseJSON(data.shipping, {});
    data.shipping = {
        freeShipping: String(shippingData.freeShipping) === "true",
        flatRateShipping: String(shippingData.flatRateShipping) === "true",
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
        const { search, category, module, provider } = req.query;
        let query = {};

        if (search) query.$text = { $search: search };
        if (category && mongoose.Types.ObjectId.isValid(category)) query.category = category;
        if (module && mongoose.Types.ObjectId.isValid(module)) query.module = module;
        if (provider && mongoose.Types.ObjectId.isValid(provider)) query.provider = provider;

        const ornaments = await Ornament.find(query).sort({ createdAt: -1 });
        const final = await Promise.all(ornaments.map((o) => populateOrnament(o._id, req)));

        sendResponse(res, 200, true, "Ornaments fetched successfully", final, { count: final.length });
    } catch (error) {
        console.error("GET ALL ORNAMENTS ERROR:", error);
        sendResponse(res, 500, false, error.message);
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
