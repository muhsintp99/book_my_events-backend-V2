const Boutique = require("../../models/vendor/boutiquePackageModel");
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

const generateBoutiqueId = () => {
    return `BTQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
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

const sanitizeBoutiqueData = (body) => {
    const data = { ...body };

    if (data.name) data.name = data.name.trim();
    if (data.description) data.description = data.description.trim();

    data.isActive = data.isActive !== undefined ? String(data.isActive) === "true" : true;
    data.isTopPick = data.isTopPick !== undefined ? String(data.isTopPick) === "true" : false;

    // Availability Mode
    data.availabilityMode = data.availabilityMode || "purchase";

    // Buy Pricing
    const bp = parseJSON(data.buyPricing, {});
    let buyTotal = Number(bp.unitPrice || 0);
    const discountVal = Number(bp.discountValue || 0);
    if (bp.discountType === "flat") {
        buyTotal = Math.max(0, buyTotal - discountVal);
    } else if (bp.discountType === "percentage") {
        buyTotal = Math.max(0, buyTotal - (buyTotal * discountVal) / 100);
    }
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
        securityDeposit: Number(rp.securityDeposit || 0),
        damagePolicy: rp.damagePolicy || "",
    };

    // Variations & Attributes
    data.attributes = parseJSON(data.attributes, []);
    data.variations = parseJSON(data.variations, []);

    // Stock
    const stockData = parseJSON(data.stock, {});
    data.stock = {
        quantity: Number(stockData.quantity || 0),
        lowStockAlert: Number(stockData.lowStockAlert || 0),
    };

    // Shipping
    // Shipping (with Takeaway + Map)
    const shippingData = parseJSON(data.shipping, {});
    data.shipping = {
        free: String(shippingData.free) === "true",
        flatRate: String(shippingData.flatRate) === "true",
        takeaway: String(shippingData.takeaway) === "true",
        takeawayLocation: shippingData.takeawayLocation || "",
        pickupLatitude: shippingData.pickupLatitude || "",
        pickupLongitude: shippingData.pickupLongitude || "",
        price: Number(shippingData.price || 0),
        minimumShippingDays: Number(shippingData.minimumShippingDays || 0),
    };


    data.occasions = parseJSON(data.occasions, []);
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
    data.relatedItems.linkByRef = data.relatedItems.linkBy === "product" ? "Boutique" : "Category";

    // IDs
    if (data.module) data.module = parseObjectId(data.module);
    if (data.category) data.category = parseObjectId(data.category);
    if (data.subCategory) data.subCategory = parseObjectId(data.subCategory);
    if (data.provider) data.provider = parseObjectId(data.provider);

    // Specialized Fields
    if (data.material) data.material = data.material.trim();
    if (data.availableColors) data.availableColors = parseJSON(data.availableColors, []);
    if (data.availableSizes) data.availableSizes = parseJSON(data.availableSizes, []);
    if (data.careInstructions) data.careInstructions = data.careInstructions.trim();

    // Rental Availability
    data.rentalAvailability = parseJSON(data.rentalAvailability, []).map(item => ({
        from: item.from ? new Date(item.from) : null,
        to: item.to ? new Date(item.to) : null,
        isBooked: String(item.isBooked) === "true",
    })).filter(item => item.from && item.to);

    // Policies
    if (data.returnPolicy) data.returnPolicy = data.returnPolicy.trim();
    if (data.cancellationPolicy) data.cancellationPolicy = data.cancellationPolicy.trim();

    return data;
};

/* =====================================================
   POPULATE BOUTIQUE HELPER
===================================================== */

const populateBoutique = async (id, req = null) => {
    const baseUrl = req
        ? `${req.protocol}://${req.get("host")}`
        : "https://api.bookmyevent.ae";

    let boutique = await Boutique.findById(id)
        .populate("module", "title icon description")
        .populate("category", "title image description")
        .populate("subCategory", "title image")
        .populate("provider", "firstName lastName email phone profilePhoto")
        .populate("relatedItems.items")
        .lean();

    if (!boutique) return null;

    // Normalize images
    if (boutique.thumbnail) {
        boutique.thumbnail = boutique.thumbnail.startsWith("http")
            ? boutique.thumbnail
            : `${baseUrl}${normalizeUploadPath(boutique.thumbnail)}`;
    }

    if (boutique.sizeGuideImage) {
        boutique.sizeGuideImage = boutique.sizeGuideImage.startsWith("http")
            ? boutique.sizeGuideImage
            : `${baseUrl}${normalizeUploadPath(boutique.sizeGuideImage)}`;
    }

    if (boutique.galleryImages && boutique.galleryImages.length > 0) {
        boutique.galleryImages = boutique.galleryImages.map((img) =>
            img.startsWith("http") ? img : `${baseUrl}${normalizeUploadPath(img)}`
        );
    }

    if (boutique.variations && boutique.variations.length > 0) {
        boutique.variations = boutique.variations.map((v) => {
            if (v.image) {
                v.image = v.image.startsWith("http")
                    ? v.image
                    : `${baseUrl}${normalizeUploadPath(v.image)}`;
            }
            return v;
        });
    }

    // Standardize provider
    if (boutique.provider) {
        boutique.provider = await enhanceProviderDetails(boutique.provider, req);
    } else {
        boutique.provider = await enhanceProviderDetails(null, req);
    }

    return boutique;
};

/* =====================================================
   CONTROLLER METHODS
===================================================== */

exports.createBoutique = async (req, res) => {
    try {
        const body = sanitizeBoutiqueData(req.body);

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

        if (req.files?.sizeGuideImage?.[0]) {
            body.sizeGuideImage = normalizeUploadPath(req.files.sizeGuideImage[0].path);
        }

        // Variation Images mapping
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

        body.boutiqueId = generateBoutiqueId();

        const boutique = await Boutique.create(body);
        const populated = await populateBoutique(boutique._id, req);

        sendResponse(res, 201, true, "Boutique package created successfully", populated);
    } catch (error) {
        console.error("CREATE BOUTIQUE ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.getAllBoutiques = async (req, res) => {
    try {
        const { search, category, module, provider, collection } = req.query;
        let query = {};

        if (search) query.$text = { $search: search };
        if (category && mongoose.Types.ObjectId.isValid(category)) query.category = category;
        if (module && mongoose.Types.ObjectId.isValid(module)) query.module = module;
        if (provider && mongoose.Types.ObjectId.isValid(provider)) query.provider = provider;
        if (req.query.availabilityMode) {
            query.availabilityMode = req.query.availabilityMode;
        }
        if (collection && ["For Men", "For Women", "For Bride", "For Groom", "For Kids"].includes(collection)) {
            query.collections = collection;
        }

        const boutiques = await Boutique.find(query).sort({ isTopPick: -1, createdAt: -1 });
        const final = await Promise.all(boutiques.map((b) => populateBoutique(b._id, req)));

        sendResponse(res, 200, true, "Boutiques fetched successfully", final, { count: final.length });
    } catch (error) {
        console.error("GET ALL BOUTIQUES ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.getBoutiqueById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return sendResponse(res, 400, false, "Invalid boutique ID");
        }
        const boutique = await populateBoutique(req.params.id, req);
        if (!boutique) return sendResponse(res, 404, false, "Boutique not found");
        sendResponse(res, 200, true, "Boutique fetched successfully", boutique);
    } catch (error) {
        console.error("GET BOUTIQUE BY ID ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.getBoutiquePackagesByProvider = async (req, res) => {
    try {
        const { providerId } = req.params;
        const { moduleId } = req.query;

        if (!mongoose.Types.ObjectId.isValid(providerId)) {
            return sendResponse(res, 400, false, "Invalid provider ID");
        }

        const query = { provider: providerId };
        if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) query.module = moduleId;

        const boutiques = await Boutique.find(query).sort({ isTopPick: -1, createdAt: -1 });
        const final = await Promise.all(boutiques.map((b) => populateBoutique(b._id, req)));

        return sendResponse(res, 200, true, "Provider packages fetched successfully", final, { count: final.length });
    } catch (error) {
        console.error("❌ Get Provider Packages Error:", error);
        return sendResponse(res, 500, false, error.message);
    }
};

exports.getVendorsForBoutiqueModule = async (req, res) => {
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
            .select("user storeName logo coverImage")
            .lean();

        if (!vendorProfiles.length) {
            return sendResponse(res, 200, true, "Vendor not found for this module", providerId ? null : []);
        }

        const vendorIds = vendorProfiles.map((vp) => vp.user);

        // ✅ COUNT BOUTIQUE PACKAGES PER VENDOR using aggregation
        const boutiqueCounts = await Boutique.aggregate([
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

        const final = await Promise.all(
            users.map(async (u) => {
                const enhanced = await enhanceProviderDetails(u, req);

                // ✅ GET BOUTIQUE COUNT FOR THIS VENDOR
                const boutiqueCount = boutiqueCounts.find(b => b._id.toString() === u._id.toString());
                enhanced.packageCount = boutiqueCount ? boutiqueCount.count : 0;

                return enhanced;
            })
        );

        // Single vendor (don't filter)
        if (providerId) {
            return sendResponse(res, 200, true, "Vendor fetched successfully", final[0] || null);
        }

        // ✅ FILTER OUT VENDORS WITH ZERO PACKAGES
        const filtered = final.filter(v => v.packageCount > 0);

        // All vendors (only those with packages)
        return sendResponse(res, 200, true, "Vendors fetched successfully", filtered, { count: filtered.length });
    } catch (err) {
        console.error("❌ Get Boutique Vendors Error:", err);
        return sendResponse(res, 500, false, err.message);
    }
};

exports.updateBoutique = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid ID");

        const body = sanitizeBoutiqueData(req.body);
        const existing = await Boutique.findById(id);
        if (!existing) return sendResponse(res, 404, false, "Boutique not found");

        if (req.files?.thumbnail?.[0]) {
            body.thumbnail = normalizeUploadPath(req.files.thumbnail[0].path);
        }
        if (req.files?.galleryImages?.length > 0) {
            body.galleryImages = req.files.galleryImages.map((f) => normalizeUploadPath(f.path));
        }

        if (req.files?.sizeGuideImage?.[0]) {
            body.sizeGuideImage = normalizeUploadPath(req.files.sizeGuideImage[0].path);
        }

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

        const updated = await Boutique.findByIdAndUpdate(id, body, { new: true });
        const populated = await populateBoutique(updated._id, req);

        sendResponse(res, 200, true, "Boutique updated successfully", populated);
    } catch (error) {
        console.error("UPDATE BOUTIQUE ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.deleteBoutique = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid ID");

        const deleted = await Boutique.findByIdAndDelete(id);
        if (!deleted) return sendResponse(res, 404, false, "Boutique not found");

        sendResponse(res, 200, true, "Boutique deleted successfully");
    } catch (error) {
        console.error("DELETE BOUTIQUE ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};

exports.toggleActiveStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid ID");

        const pkg = await Boutique.findById(id);
        if (!pkg) return sendResponse(res, 404, false, "Not found");

        pkg.isActive = !pkg.isActive;
        await pkg.save();

        return sendResponse(res, 200, true, `Boutique ${pkg.isActive ? "activated" : "deactivated"}`, pkg);
    } catch (err) {
        console.error("❌ Toggle Active Error:", err);
        return sendResponse(res, 500, false, err.message);
    }
};

exports.toggleTopPickStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return sendResponse(res, 400, false, "Invalid ID");

        const pkg = await Boutique.findById(id);
        if (!pkg) return sendResponse(res, 404, false, "Not found");

        pkg.isTopPick = !pkg.isTopPick;
        await pkg.save();

        return sendResponse(res, 200, true, `Top pick ${pkg.isTopPick ? "enabled" : "disabled"}`, pkg);
    } catch (err) {
        console.error("❌ Toggle TopPick Error:", err);
        return sendResponse(res, 500, false, err.message);
    }
};

/* =====================================================
   ADDITIONAL LISTS (Vendors, Categories, Occasions)
===================================================== */

exports.getBoutiqueVendors = async (req, res) => {
    try {
        const Module = require("../../models/admin/module");
        const boutiqueModule = await Module.findOne({ title: /boutique/i });

        if (!boutiqueModule) {
            return sendResponse(res, 404, false, "Boutique module not found");
        }

        const vendorProfiles = await VendorProfile.find({ module: boutiqueModule._id })
            .select("user storeName logo coverImage")
            .lean();

        if (!vendorProfiles.length) {
            return sendResponse(res, 200, true, "No vendors found for Boutique module", []);
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

        return sendResponse(res, 200, true, "Boutique vendors fetched successfully", final, { count: final.length });
    } catch (err) {
        console.error("❌ Get All Boutique Vendors Error:", err);
        return sendResponse(res, 500, false, err.message);
    }
};

exports.getCategories = async (req, res) => {
    try {
        const { moduleId } = req.query;
        let moduleFilter = {};

        if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
            moduleFilter = { module: moduleId };
        } else {
            const Module = require("../../models/admin/module");
            const boutiqueModule = await Module.findOne({ title: /boutique/i });
            if (boutiqueModule) {
                moduleFilter = { module: boutiqueModule._id };
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

                const packageCount = await Boutique.countDocuments({
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

exports.getOccasions = async (req, res) => {
    try {
        const occasions = await Boutique.distinct("occasions", { isActive: true });
        const occasionData = await Promise.all(
            occasions.map(async (occ) => {
                const packages = await Boutique.find({
                    occasions: occ,
                    isActive: true
                }).sort({ isTopPick: -1, createdAt: -1 }).limit(10);

                const populated = await Promise.all(
                    packages.map(p => populateBoutique(p._id, req))
                );

                return {
                    name: occ,
                    count: await Boutique.countDocuments({ occasions: occ, isActive: true }),
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
exports.getCollections = async (req, res) => {
    try {
        const { collection } = req.query;
        const allCollections = ["For Men", "For Women", "For Bride", "For Groom", "For Kids"];

        // Filter to specific collection if provided
        const collectionsToFetch = collection && allCollections.includes(collection)
            ? [collection]
            : allCollections;

        const collectionData = await Promise.all(
            collectionsToFetch.map(async (coll) => {
                const packages = await Boutique.find({
                    collections: coll,
                    isActive: true,
                }).sort({ isTopPick: -1, createdAt: -1 }).lean();

                const populatedPackages = await Promise.all(
                    packages.map((pkg) => populateBoutique(pkg._id, req))
                );

                return {
                    name: coll,
                    count: populatedPackages.length,
                    icon: `collection-${coll.toLowerCase().replace(/\s+/g, "-")}`,
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

exports.migrateAllToSeparate = async (req, res) => {
    try {
        const boutiques = await Boutique.find({
            availabilityMode: { $nin: ["purchase", "rental"] }
        });

        if (boutiques.length === 0) {
            return sendResponse(res, 200, true, "No boutiques with 'all' mode found.");
        }

        let splitCount = 0;
        for (const item of boutiques) {
            const rentalItem = item.toObject();
            delete rentalItem._id;
            delete rentalItem.createdAt;
            delete rentalItem.updatedAt;
            rentalItem.availabilityMode = "rental";
            rentalItem.boutiqueId = `BTQ-RENT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            await Boutique.create(rentalItem);

            item.availabilityMode = "purchase";
            await item.save();
            splitCount++;
        }

        sendResponse(res, 200, true, `Successfully split ${splitCount} boutiques into separate Purchase and Rental records.`);
    } catch (error) {
        console.error("MIGRATE BOUTIQUES ERROR:", error);
        sendResponse(res, 500, false, error.message);
    }
};