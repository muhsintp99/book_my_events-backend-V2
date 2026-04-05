const Package = require("../../models/admin/Package");
const User = require("../../models/User");
const VendorProfile = require("../../models/vendor/vendorProfile");
const Subscription = require("../../models/admin/Subscription");
const Pincode = require("../../models/vendor/Pincode");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

/* =====================================================
   HELPER: Delete Image
===================================================== */
const deleteFileIfExists = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try {
            const absolutePath = filePath.startsWith("/")
                ? path.join(__dirname, "../../", filePath)
                : filePath;
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
        } catch (err) {
            console.error(`Error deleting file: ${filePath}`, err);
        }
    }
};

/* =====================================================
   1. CREATE UNIVERSAL PACKAGE
===================================================== */
exports.createSecondaryPackage = async (req, res) => {
    try {
        const {
            moduleId,        // Same as secondaryModule in panthal
            providerId,      // providerId
            title,           // packageName
            description,     // description
            price,           // packagePrice
            advanceBookingAmount, // advanceBookingAmount
            includes,        // Universal field
            categories       // services in panthal
        } = req.body;

        if (!title || !moduleId || !providerId) {
            return res.status(400).json({ success: false, message: "Required fields missing (title, moduleId, providerId)" });
        }

        // Parsing Categories/Services
        let parsedCategories = [];
        const rawCats = categories || req.body.services; // fallback handle
        if (rawCats) {
            try {
                if (typeof rawCats === 'string') {
                    let clean = rawCats.trim();
                    if (clean.startsWith('[') && clean.endsWith(']')) {
                        clean = clean.replace(/'/g, '"');
                        parsedCategories = JSON.parse(clean);
                    } else if (clean.includes(',')) {
                        parsedCategories = clean.split(',').map(s => s.trim());
                    } else {
                        parsedCategories = [clean];
                    }
                } else {
                    parsedCategories = Array.isArray(rawCats) ? rawCats : [rawCats];
                }
            } catch (e) {
                console.error("Categories parsing error:", e);
            }
        }

        // Parsing Includes
        let parsedIncludes = [];
        if (includes) {
            try {
                if (typeof includes === 'string') {
                    parsedIncludes = JSON.parse(includes.replace(/'/g, '"'));
                } else {
                    parsedIncludes = Array.isArray(includes) ? includes : [includes];
                }
            } catch (e) {
                console.error("Includes parsing error:", e);
            }
        }

        const packageId = `PKG-${Date.now()}`;
        const thumbnail = req.file ? `/Uploads/packages/${req.file.filename}` : null;

        const pkg = await Package.create({
            packageId,
            module: moduleId,
            provider: providerId,
            createdBy: providerId,
            title,
            description,
            price: Number(price) || 0,
            advanceAmount: Number(advanceBookingAmount) || 0,
            thumbnail,
            images: thumbnail ? [thumbnail] : [],
            categories: parsedCategories,
            includes: parsedIncludes.map(item => (typeof item === 'string' ? { title: item, items: [] } : item))
        });

        const populatedPkg = await Package.findById(pkg._id)
            .populate("module", "title icon")
            .populate("categories", "title image")
            .populate("provider", "firstName lastName email phone");

        res.status(201).json({
            success: true,
            message: "Modular package created successfully",
            data: populatedPkg
        });

    } catch (err) {
        console.error("Create Package Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   2. GET ALL PACKAGES (SEARCH + FILTER + PAGINATION)
===================================================== */
exports.getAllSecondaryPackages = async (req, res) => {
    try {
        const {
            keyword,
            moduleId,
            minPrice,
            maxPrice,
            zoneId,
            city,
            categoryId,
            page = 1,
            limit = 10
        } = req.query;

        const skip = (page - 1) * limit;
        let matchStage = { isActive: true };

        if (keyword) {
            matchStage.title = { $regex: keyword, $options: "i" };
        }

        if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
            matchStage.module = new mongoose.Types.ObjectId(moduleId);
        }

        if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
            matchStage.categories = new mongoose.Types.ObjectId(categoryId);
        }

        if (minPrice || maxPrice) {
            matchStage.price = {};
            if (minPrice) matchStage.price.$gte = Number(minPrice);
            if (maxPrice) matchStage.price.$lte = Number(maxPrice);
        }

        const pipeline = [
            { $match: matchStage },
            {
                $lookup: {
                    from: "users",
                    localField: "provider",
                    foreignField: "_id",
                    as: "provider",
                },
            },
            { $unwind: "$provider" },
            {
                $lookup: {
                    from: "vendorprofiles",
                    localField: "provider._id",
                    foreignField: "user",
                    as: "vendorProfile",
                },
            },
            { $unwind: "$vendorProfile" },
            {
                $match: { "vendorProfile.isActive": true }
            }
        ];

        // Geo Filters
        if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
            pipeline.push({
                $match: { "vendorProfile.zones": new mongoose.Types.ObjectId(zoneId) }
            });
        }
        if (city) {
            pipeline.push({
                $match: { "vendorProfile.storeAddress.city": { $regex: city, $options: "i" } }
            });
        }

        pipeline.push({
            $lookup: {
                from: "secondarymodules",
                localField: "module",
                foreignField: "_id",
                as: "module",
            },
        });
        pipeline.push({ $unwind: "$module" });

        const dataPipeline = [
            ...pipeline,
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
        ];

        const packages = await Package.aggregate(dataPipeline);
        
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Package.aggregate(countPipeline);
        const total = countResult[0]?.total || 0;

        res.json({
            success: true,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            data: packages,
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   3. GET SINGLE PACKAGE BY ID
===================================================== */
exports.getSecondaryPackageById = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id)
            .populate({
                path: "provider",
                select: "firstName lastName email phone profilePhoto",
                populate: {
                    path: "vendorProfile",
                    populate: ["zones", "categories"]
                }
            })
            .populate("module", "title icon")
            .populate("categories", "title image");

        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        // Normalizing profile photo
        if (pkg.provider && !pkg.provider.profilePhoto && pkg.provider.vendorProfile?.logo) {
            pkg.provider.profilePhoto = pkg.provider.vendorProfile.logo;
        }

        res.json({ success: true, data: pkg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   4. GET PACKAGES BY VENDOR (Panthal-Style)
===================================================== */
exports.getPackagesByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({ success: false, message: "Invalid vendor ID" });
        }

        const packages = await Package.find({
            provider: vendorId,
            isActive: true
        })
        .populate("module", "title icon")
        .populate("categories", "title image")
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: packages.length,
            data: packages
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   5. GET VENDORS WITH PACKAGE COUNT (Discovery stage)
===================================================== */
exports.getSecondaryVendors = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { zoneId, city } = req.query;

        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ success: false, message: "Invalid module ID" });
        }

        // 1. Find Vendor Profiles
        let profileMatch = {
            module: new mongoose.Types.ObjectId(moduleId),
            isActive: true
        };

        if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) profileMatch.zones = new mongoose.Types.ObjectId(zoneId);
        if (city) profileMatch["storeAddress.city"] = { $regex: city, $options: "i" };

        const vendorProfiles = await VendorProfile.find(profileMatch)
            .select("user storeName storeAddress zones logo categories latitude longitude")
            .lean();

        if (!vendorProfiles.length) return res.json({ success: true, count: 0, data: [] });

        const vendorIdsFromProfiles = vendorProfiles.map(vp => vp.user);

        // 2. Get Package counts
        const packagesAgg = await Package.aggregate([
            {
                $match: {
                    module: new mongoose.Types.ObjectId(moduleId),
                    isActive: true,
                    provider: { $in: vendorIdsFromProfiles }
                }
            },
            { $group: { _id: "$provider", packageCount: { $sum: 1 } } }
        ]);

        const activeVendorIds = packagesAgg.map(v => v._id.toString());

        // 3. Fetch user details and combine
        const users = await User.find({ _id: { $in: activeVendorIds } })
            .select("firstName lastName email phone profilePhoto")
            .populate({
                path: "vendorProfile",
                populate: [{ path: "zones", select: "name" }]
            }).lean();

        const subscriptions = await Subscription.find({
            userId: { $in: activeVendorIds },
            isCurrent: true,
        }).populate("planId").lean();

        const final = users.map(user => {
            const countObj = packagesAgg.find(v => v._id.toString() === user._id.toString());
            const vp = user.vendorProfile || {};
            const sub = subscriptions.find(s => s.userId.toString() === user._id.toString());

            return {
                ...user,
                profilePhoto: user.profilePhoto || vp.logo || "",
                packageCount: countObj?.packageCount || 0,
                storeName: vp.storeName,
                zone: vp.zones?.[0] || null,
                storeAddress: vp.storeAddress,
                subscription: sub ? { status: sub.status, plan: sub.planId } : { status: "none" }
            };
        });

        res.json({ success: true, count: final.length, data: final });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   6. UPDATE UNIVERSAL PACKAGE
===================================================== */
exports.updateSecondaryPackage = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        const { title, description, price, advanceBookingAmount, categories, isActive, isTopPick } = req.body;

        if (title) pkg.title = title;
        if (description) pkg.description = description;
        if (price !== undefined) pkg.price = Number(price);
        if (advanceBookingAmount !== undefined) pkg.advanceAmount = Number(advanceBookingAmount);
        
        if (isActive !== undefined) pkg.isActive = (isActive === 'true' || isActive === true);
        if (isTopPick !== undefined) pkg.isTopPick = (isTopPick === 'true' || isTopPick === true);

        if (categories) {
            try {
                let parsed = typeof categories === 'string' ? JSON.parse(categories.replace(/'/g, '"')) : categories;
                pkg.categories = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                console.error("Categories update error:", e);
            }
        }

        if (req.file) {
            deleteFileIfExists(pkg.thumbnail);
            pkg.thumbnail = `/Uploads/packages/${req.file.filename}`;
            pkg.images = [pkg.thumbnail];
        }

        await pkg.save();

        res.json({
            success: true,
            message: "Package updated successfully",
            data: pkg
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   7. DELETE PACKAGE
===================================================== */
exports.deleteSecondaryPackage = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        deleteFileIfExists(pkg.thumbnail);
        await pkg.deleteOne();

        res.json({ success: true, message: "Package deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   8. TOGGLES (ACTIVE/TOPPICK)
===================================================== */
exports.toggleSecondaryActiveStatus = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        pkg.isActive = !pkg.isActive;
        await pkg.save();
        res.json({ success: true, data: pkg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.toggleSecondaryTopPickStatus = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        pkg.isTopPick = !pkg.isTopPick;
        await pkg.save();
        res.json({ success: true, data: pkg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
