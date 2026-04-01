const Invitation = require("../../models/vendor/invitationPackageModel");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const Pincode = require("../../models/vendor/Pincode");
const Subscription = require("../../models/admin/Subscription");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

/* =====================================================
   HELPER: Delete File
===================================================== */
const deleteFileIfExists = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try {
            // Ensure we are working with an absolute path if it starts with /Uploads
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
   CREATE PACKAGE
===================================================== */
exports.createInvitationPackage = async (req, res) => {
    try {
        const {
            secondaryModule,
            module,
            providerId,
            packageName,
            description,
            packagePrice,
            advanceBookingAmount,
            services,
        } = req.body;

        let parsedServices = [];
        if (services) {
            try {
                let rawSvc = services;
                if (Array.isArray(rawSvc) && rawSvc.length === 1 && typeof rawSvc[0] === 'string' && rawSvc[0].trim().startsWith('[')) {
                    rawSvc = rawSvc[0];
                }

                if (typeof rawSvc === 'string') {
                    let clean = rawSvc.trim();
                    if (clean.startsWith('[') && clean.endsWith(']')) {
                        clean = clean.replace(/'/g, '"');
                        parsedServices = JSON.parse(clean);
                    } else if (clean.includes(',')) {
                        parsedServices = clean.split(',').map(s => s.trim());
                    } else if (clean) {
                        parsedServices = [clean];
                    }
                } else {
                    parsedServices = Array.isArray(rawSvc) ? rawSvc : [rawSvc];
                }
            } catch (e) {
                console.error("Services parsing error:", e);
                parsedServices = [];
            }
        }

        if (!packageName)
            return res.status(400).json({ success: false, message: "Package name required" });

        if (!providerId)
            return res.status(400).json({ success: false, message: "Provider required" });

        const packageId = `INV-${Date.now()}`;

        // Handle thumbnail
        let thumbnail = null;
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            thumbnail = `/uploads/invitation/${req.files.thumbnail[0].filename}`;
        }

        // Handle multiple images
        let images = [];
        if (req.files && req.files.images) {
            images = req.files.images.map(file => `/uploads/invitation/${file.filename}`);
        }

        const pkg = await Invitation.create({
            packageId,
            secondaryModule: secondaryModule || module,
            provider: providerId,
            packageName,
            description,
            packagePrice,
            advanceBookingAmount,
            services: parsedServices,
            thumbnail,
            images,
        });

        const populatedPkg = await Invitation.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("services", "title image")
            .populate("provider", "firstName lastName email phone");

        res.status(201).json({
            success: true,
            message: "Invitation package created successfully",
            data: populatedPkg,
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   GET ALL PACKAGES (SEARCH + FILTER + PAGINATION)
===================================================== */
exports.getAllInvitationPackages = async (req, res) => {
    try {
        const {
            keyword,
            moduleId,
            minPrice,
            maxPrice,
            zoneId,
            city,
            address,
            serviceId,
            provider,
            page = 1,
            limit = 10,
        } = req.query;

        const skip = (page - 1) * limit;

        let matchStage = { isActive: true };

        if (keyword) {
            matchStage.packageName = { $regex: keyword, $options: "i" };
        }

        if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
            matchStage.secondaryModule = new mongoose.Types.ObjectId(moduleId);
        }

        if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
            matchStage.services = new mongoose.Types.ObjectId(serviceId);
        }

        if (provider && mongoose.Types.ObjectId.isValid(provider)) {
            matchStage.provider = new mongoose.Types.ObjectId(provider);
        }

        if (minPrice) {
            matchStage.packagePrice = { ...matchStage.packagePrice, $gte: Number(minPrice) };
        }

        if (maxPrice) {
            matchStage.packagePrice = { ...matchStage.packagePrice, $lte: Number(maxPrice) };
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
                $addFields: {
                    "provider.profilePhoto": {
                        $cond: {
                            if: { $or: [{ $eq: ["$provider.profilePhoto", ""] }, { $not: ["$provider.profilePhoto"] }] },
                            then: { $ifNull: ["$vendorProfile.logo", ""] },
                            else: "$provider.profilePhoto"
                        }
                    }
                }
            },
            {
                $match: {
                    "vendorProfile.status": "approved",
                    "vendorProfile.isActive": true,
                },
            },
        ];

        if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
            pipeline.push({
                $match: {
                    "vendorProfile.zones": new mongoose.Types.ObjectId(zoneId),
                },
            });
        }

        if (city) {
            pipeline.push({
                $match: {
                    "vendorProfile.storeAddress.city": { $regex: city, $options: "i" },
                },
            });
        }

        if (address) {
            pipeline.push({
                $match: {
                    "vendorProfile.storeAddress.fullAddress": { $regex: address, $options: "i" },
                },
            });
        }

        // Populations
        pipeline.push({
            $lookup: {
                from: "secondarymodules",
                localField: "secondaryModule",
                foreignField: "_id",
                as: "secondaryModule",
            },
        });
        pipeline.push({ $unwind: "$secondaryModule" });

        pipeline.push({
            $lookup: {
                from: "categories",
                localField: "services",
                foreignField: "_id",
                as: "services",
            },
        });

        pipeline.push({
            $project: {
                "provider.password": 0,
                "provider.refreshToken": 0,
                "provider.otp": 0,
            },
        });

        const dataPipeline = [
            ...pipeline,
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
        ];

        const packages = await Invitation.aggregate(dataPipeline);

        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Invitation.aggregate(countPipeline);
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
   GET SINGLE PACKAGE BY ID
===================================================== */
exports.getInvitationPackageById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid package ID" });
        }

        const pkg = await Invitation.findById(id)
            .populate({
                path: "provider",
                select: "firstName lastName email phone profilePhoto",
                populate: {
                    path: "vendorProfile",
                    match: { status: "approved", isActive: true },
                    populate: [
                        { path: "zones", select: "_id name city country" },
                        { path: "services", select: "_id title image" },
                        { path: "specialised", select: "_id title image" }
                    ]
                }
            })
            .populate({
                path: "secondaryModule",
                select: "_id title icon"
            })
            .populate({
                path: "services",
                select: "_id title image"
            });


        if (!pkg) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }

        if (pkg && pkg.provider && !pkg.provider.profilePhoto && pkg.provider.vendorProfile?.logo) {
            pkg.provider.profilePhoto = pkg.provider.vendorProfile.logo;
        }

        if (pkg && pkg.provider && pkg.provider.vendorProfile) {
            pkg.provider.vendorProfile.zone = pkg.provider.vendorProfile.zones?.[0] || null;
        }

        res.json({ success: true, data: pkg });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   GET PACKAGES BY VENDOR
===================================================== */
exports.getInvitationByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { moduleId } = req.query;

        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({ success: false, message: "Invalid vendor ID" });
        }

        let query = { provider: vendorId };

        if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
            query.secondaryModule = new mongoose.Types.ObjectId(moduleId);
        }

        const packages = await Invitation.find(query)
            .populate({
                path: "provider",
                select: "firstName lastName email phone profilePhoto",
                populate: {
                    path: "vendorProfile",
                    populate: [
                        { path: "zones", select: "_id name city country" },
                        { path: "services", select: "_id title image" },
                        { path: "specialised", select: "_id title image" }
                    ]
                }
            })
            .populate({
                path: "secondaryModule",
                select: "_id title icon"
            })
            .populate({
                path: "services",
                select: "_id title image"
            })
            .sort({ createdAt: -1 });

        packages.forEach(pkg => {
            if (pkg.provider && !pkg.provider.profilePhoto && pkg.provider.vendorProfile?.logo) {
                pkg.provider.profilePhoto = pkg.provider.vendorProfile.logo;
            }
            if (pkg.provider && pkg.provider.vendorProfile) {
                pkg.provider.vendorProfile.zone = pkg.provider.vendorProfile.zones?.[0] || null;
            }
        });

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
   GET VENDORS WITH PACKAGE COUNT
===================================================== */
exports.getInvitationVendors = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { zoneId, city, address } = req.query;

        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid module ID"
            });
        }

        /* ================================
           1️⃣ Find Vendor Profiles (Main Filter)
        ================================= */
        let profileMatch = {
            module: new mongoose.Types.ObjectId(moduleId),
            isActive: true
        };

        if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
            profileMatch.zones = new mongoose.Types.ObjectId(zoneId);
        }

        if (city) {
            profileMatch["storeAddress.city"] = { $regex: city, $options: "i" };
        }

        if (address) {
            profileMatch["storeAddress.fullAddress"] = { $regex: address, $options: "i" };
        }

        const vendorProfiles = await VendorProfile.find(profileMatch)
            .select("user storeName storeAddress zones services specialised latitude longitude status")
            .lean();

        if (!vendorProfiles.length) {
            return res.json({
                success: true,
                count: 0,
                data: []
            });
        }

        const vendorIds = vendorProfiles.map((vp) => vp.user);

        /* ================================
           2️⃣ Get Package Counts for these Vendors
        ================================= */
        const vendorsAgg = await Invitation.aggregate([
            {
                $match: {
                    secondaryModule: new mongoose.Types.ObjectId(moduleId),
                    provider: { $in: vendorIds },
                    isActive: true
                }
            },
            {
                $group: {
                    _id: "$provider",
                    packageCount: { $sum: 1 }
                }
            }
        ]);

        /* ================================
           3️⃣ Fetch User Details and Combine
        ================================= */
        const users = await User.find({ _id: { $in: vendorIds } })
            .select("firstName lastName email phone profilePhoto")
            .populate({
                path: "vendorProfile",
                populate: [
                    { path: "zones", select: "name" },
                    { path: "services", select: "title icon slug" },
                    { path: "specialised", select: "title icon slug" }
                ]
            })
            .lean();

        /* ================================
           4️⃣ Fetch Detailed Packages
        ================================= */
        const allPackages = await Invitation.find({
            secondaryModule: new mongoose.Types.ObjectId(moduleId),
            provider: { $in: vendorIds },
            isActive: true
        })
            .select("provider packageId packageName description packagePrice thumbnail images isActive isTopPick category")
            .populate("category", "title image icon")
            .lean();

        // ✅ Fetch Subscriptions for these vendors
        const subscriptions = await Subscription.find({
            userId: { $in: vendorIds },
            isCurrent: true,
        })
            .populate("planId")
            .populate("moduleId", "title icon")
            .lean();

        const final = users.map(user => {
            const countObj = vendorsAgg.find(
                v => v._id.toString() === user._id.toString()
            );

            const vp = user.vendorProfile || {};

            // ✅ Filter packages for THIS vendor
            const vendorPackages = allPackages.filter(
                p => p.provider?.toString() === user._id.toString()
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
                profilePhoto: user.profilePhoto || user.vendorProfile?.logo || "",

                packageCount: countObj?.packageCount || 0,
                status: vp.status,
                packages: vendorPackages,

                storeName: vp.storeName,
                zone: vp.zones?.[0] || null,
                zones: vp.zones || [],
                storeAddress: vp.storeAddress,

                // ✅ Categories Added
                categories: vp.services,
                specialised: vp.specialised,

                latitude: vp.latitude,
                longitude: vp.longitude,
                _needsZoneLookup: !vp.zones || vp.zones.length === 0,

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
                            autoRenew: sub.autoRenew
                        },
                        access: {
                            canAccess: sub.status === "active" && !isExpired,
                            isExpired,
                            daysLeft
                        }
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
                            daysLeft: 0
                        }
                    }
            };
        });

        // ✅ STAGE 2: CROSS-PROFILE FALLBACK
        const vendorsNeedingZones = final.filter(v => v._needsZoneLookup);
        if (vendorsNeedingZones.length > 0) {
            const idsNeedingZones = vendorsNeedingZones.map(v => v._id);
            const otherProfiles = await VendorProfile.find({
                user: { $in: idsNeedingZones },
                status: "approved",
                isActive: true,
                zones: { $exists: true, $ne: [] }
            })
            .select("user zones storeAddress")
            .populate("zones", "name")
            .lean();

            for (const vendor of vendorsNeedingZones) {
                const otherVp = otherProfiles.find(p => p.user.toString() === vendor._id.toString());
                if (otherVp && otherVp.zones && otherVp.zones.length > 0) {
                    vendor.zone = otherVp.zones[0];
                    vendor.zones = otherVp.zones;
                }
                if (!vendor.storeAddress && otherVp?.storeAddress) {
                    vendor.storeAddress = otherVp.storeAddress;
                }
            }
        }

        // Remove internal flag
        final.forEach(v => delete v._needsZoneLookup);

        // ✅ STAGE 3: FINAL FALLBACKS (Geography and Address Parsing)
        const zoneMissing = final.filter(v => !v.zone);
        if (zoneMissing.length > 0) {
            const Zone = mongoose.model("Zone");
            const allZones = await Zone.find({ isActive: true }).select("name").lean();
            
            for (const vendor of zoneMissing) {
                try {
                    if (vendor.latitude && vendor.longitude) {
                        const nearestPincode = await Pincode.findOne({
                            location: {
                                $near: {
                                    $geometry: {
                                        type: "Point",
                                        coordinates: [parseFloat(vendor.longitude), parseFloat(vendor.latitude)],
                                    },
                                    $maxDistance: 50000,
                                },
                            },
                        })
                        .populate("zone_id", "name")
                        .lean();

                        if (nearestPincode) {
                            if (nearestPincode.zone_id) {
                                vendor.zone = nearestPincode.zone_id;
                            } else {
                                const possibleName = nearestPincode.city || nearestPincode.state;
                                const matchedZone = allZones.find(z => z.name.toLowerCase() === possibleName?.toLowerCase());
                                vendor.zone = matchedZone || { _id: null, name: possibleName };
                            }
                            if (!vendor.storeAddress || !vendor.storeAddress.city) {
                                vendor.storeAddress = { ...vendor.storeAddress, city: nearestPincode.city || vendor.zone?.name };
                            }
                        }
                    }

                    if (!vendor.zone) {
                        const addressText = `${vendor.storeAddress?.fullAddress || ""} ${vendor.storeAddress?.city || ""} ${vendor.storeAddress?.street || ""}`.toLowerCase();
                        let searchStr = addressText;
                        if (searchStr.includes("calicut")) searchStr += " kozhikode";
                        if (searchStr.includes("kochi") || searchStr.includes("cochin")) searchStr += " ernakulam";
                        if (searchStr.includes("trivandrum")) searchStr += " thiruvananthapuram";

                        const matchedZone = allZones.find(z => searchStr.includes(z.name.toLowerCase()));
                        if (matchedZone) vendor.zone = matchedZone;
                    }
                } catch (err) {
                    console.error("Final fallback error for invitation vendor:", vendor._id, err.message);
                }
            }
        }

        // ✅ FILTER: Only show vendors that HAVE at least one active package in this module
        const filtered = final.filter(v => v.packageCount > 0);

        res.json({
            success: true,
            count: filtered.length,
            data: filtered
        });

    } catch (err) {
        console.error("❌ Get Invitation Vendors Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   UPDATE PACKAGE
===================================================== */
exports.updateInvitationPackage = async (req, res) => {
    try {
        const pkg = await Invitation.findById(req.params.id);
        if (!pkg)
            return res.status(404).json({ success: false, message: "Package not found" });

        const {
            packageName,
            description,
            packagePrice,
            advanceBookingAmount,
            services,
            updatedBy,
        } = req.body;

        if (packageName) pkg.packageName = packageName;
        if (description) pkg.description = description;
        if (packagePrice) pkg.packagePrice = packagePrice;
        if (advanceBookingAmount) pkg.advanceBookingAmount = advanceBookingAmount;

        if (services) {
            let parsedServices = [];
            try {
                let rawSvc = services;
                if (Array.isArray(rawSvc) && rawSvc.length === 1 && typeof rawSvc[0] === 'string' && rawSvc[0].trim().startsWith('[')) {
                    rawSvc = rawSvc[0];
                }

                if (typeof rawSvc === 'string') {
                    let clean = rawSvc.trim();
                    if (clean.startsWith('[') && clean.endsWith(']')) {
                        clean = clean.replace(/'/g, '"');
                        parsedServices = JSON.parse(clean);
                    } else if (clean.includes(',')) {
                        parsedServices = clean.split(',').map(s => s.trim());
                    } else if (clean) {
                        parsedServices = [clean];
                    }
                } else {
                    parsedServices = Array.isArray(rawSvc) ? rawSvc : [rawSvc];
                }
            } catch (e) {
                console.error("Services parsing error:", e);
                parsedServices = [];
            }
            pkg.services = parsedServices;
        }

        // Handle thumbnail update
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            if (pkg.thumbnail) deleteFileIfExists(pkg.thumbnail);
            pkg.thumbnail = `/uploads/invitation/${req.files.thumbnail[0].filename}`;
        }

        // Handle images update (replaces all images if provided)
        if (req.files && req.files.images && req.files.images.length > 0) {
            if (pkg.images && pkg.images.length > 0) {
                pkg.images.forEach(img => deleteFileIfExists(img));
            }
            pkg.images = req.files.images.map(file => `/uploads/invitation/${file.filename}`);
        }

        pkg.updatedBy = updatedBy || pkg.updatedBy;

        await pkg.save();

        const populatedPkg = await Invitation.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("provider", "firstName lastName email phone");

        res.json({
            success: true,
            message: "Package updated successfully",
            data: populatedPkg,
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   DELETE PACKAGE
===================================================== */
exports.deleteInvitationPackage = async (req, res) => {
    try {
        const pkg = await Invitation.findById(req.params.id);
        if (!pkg)
            return res.status(404).json({ success: false, message: "Package not found" });

        // Cleanup files
        if (pkg.thumbnail) deleteFileIfExists(pkg.thumbnail);
        if (pkg.images && pkg.images.length > 0) {
            pkg.images.forEach(img => deleteFileIfExists(img));
        }

        await pkg.deleteOne();

        res.json({
            success: true,
            message: "Package deleted successfully",
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   TOGGLE STATUSES
===================================================== */
exports.toggleActiveStatus = async (req, res) => {
    try {
        const pkg = await Invitation.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        pkg.isActive = !pkg.isActive;
        await pkg.save();
        res.json({ success: true, data: pkg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.toggleTopPickStatus = async (req, res) => {
    try {
        const pkg = await Invitation.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        pkg.isTopPick = !pkg.isTopPick;
        await pkg.save();
        res.json({ success: true, data: pkg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
