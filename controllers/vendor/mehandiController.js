const Mehandi = require("../../models/vendor/mehandiPackageModel");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const mongoose = require("mongoose");
const Pincode = require("../../models/vendor/Pincode");
const Subscription = require("../../models/admin/Subscription");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

/* =====================================================
   HELPER: Delete Image
===================================================== */
const deleteFileIfExists = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

/* =====================================================
   CREATE PACKAGE
===================================================== */
exports.createMehandiPackage = async (req, res) => {
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
                // If it's an array of length 1 containing a string that looks like a JSON array, unpack it
                if (Array.isArray(rawSvc) && rawSvc.length === 1 && typeof rawSvc[0] === 'string' && rawSvc[0].trim().startsWith('[')) {
                    rawSvc = rawSvc[0];
                }

                if (typeof rawSvc === 'string') {
                    let clean = rawSvc.trim();
                    if (clean.startsWith('[') && clean.endsWith(']')) {
                        // Replace single quotes with double quotes for valid JSON
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

        const packageId = `MEH-${Date.now()}`;

        const image = req.file
            ? `/Uploads/mehandi/${req.file.filename}`
            : null;

        const pkg = await Mehandi.create({
            packageId,
            secondaryModule: secondaryModule || module,
            provider: providerId,
            packageName,
            description,
            packagePrice,
            advanceBookingAmount,
            services: parsedServices,
            image,
        });

        const populatedPkg = await Mehandi.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("services", "title image icon")
            .populate("provider", "firstName lastName email phone");

        res.status(201).json({
            success: true,
            message: "Mehandi package created successfully",
            data: populatedPkg,
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
/* =====================================================
   GET ALL PACKAGES (SEARCH + FILTER + PAGINATION)
===================================================== */
// exports.getAllMehandiPackages = async (req, res) => {
//   try {
//     const {
//       keyword,
//       moduleId,
//       minPrice,
//       maxPrice,
//       page = 1,
//       limit = 10,
//     } = req.query;

//     let query = {};

//     if (keyword) {
//       query.packageName = { $regex: keyword, $options: "i" };
//     }

//     if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
//       query.secondaryModule = moduleId;
//     }

//     if (minPrice) {
//       query.packagePrice = { ...query.packagePrice, $gte: Number(minPrice) };
//     }

//     if (maxPrice) {
//       query.packagePrice = { ...query.packagePrice, $lte: Number(maxPrice) };
//     }

//     const skip = (page - 1) * limit;

//     const packages = await Mehandi.find(query)
//       .populate("provider", "firstName lastName email phone")
//       .populate("secondaryModule", "title")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     const total = await Mehandi.countDocuments(query);

//     res.json({
//       success: true,
//       count: packages.length,
//       total,
//       totalPages: Math.ceil(total / limit),
//       page: Number(page),
//       data: packages,
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.getAllMehandiPackages = async (req, res) => {
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
            page = 1,
            limit = 10,
        } = req.query;

        const skip = (page - 1) * limit;

        /* =====================================================
           BASE MATCH
        ===================================================== */
        let matchStage = { isActive: true };

        if (keyword) {
            matchStage.packageName = { $regex: keyword, $options: "i" };
        }

        if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
            matchStage.secondaryModule = new mongoose.Types.ObjectId(moduleId);
        }

        if (minPrice) {
            matchStage.packagePrice = { ...matchStage.packagePrice, $gte: Number(minPrice) };
        }

        if (maxPrice) {
            matchStage.packagePrice = { ...matchStage.packagePrice, $lte: Number(maxPrice) };
        }

        if (serviceId && mongoose.Types.ObjectId.isValid(serviceId)) {
            matchStage.services = new mongoose.Types.ObjectId(serviceId);
        }

        /* =====================================================
           MAIN PIPELINE
        ===================================================== */
        const pipeline = [
            { $match: matchStage },

            /* ---------- provider ---------- */
            {
                $lookup: {
                    from: "users",
                    localField: "provider",
                    foreignField: "_id",
                    as: "provider",
                },
            },
            { $unwind: "$provider" },

            /* ---------- vendor profile ---------- */
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

        /* ---------- zone filter ---------- */
        if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
            pipeline.push({
                $match: {
                    "vendorProfile.zones": new mongoose.Types.ObjectId(zoneId),
                },
            });
        }

        /* ---------- city filter ---------- */
        if (city) {
            pipeline.push({
                $match: {
                    "vendorProfile.storeAddress.city": {
                        $regex: city,
                        $options: "i",
                    },
                },
            });
        }

        /* ---------- address filter ---------- */
        if (address) {
            pipeline.push({
                $match: {
                    "vendorProfile.storeAddress.fullAddress": {
                        $regex: address,
                        $options: "i",
                    },
                },
            });
        }

        /* =====================================================
           POPULATIONS
        ===================================================== */

        /* secondary module */
        pipeline.push({
            $lookup: {
                from: "secondarymodules",
                localField: "secondaryModule",
                foreignField: "_id",
                as: "secondaryModule",
            },
        });
        pipeline.push({ $unwind: "$secondaryModule" });

        /* zones */
        pipeline.push({
            $lookup: {
                from: "zones",
                let: { zoneIds: "$vendorProfile.zones" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ["$_id", { $ifNull: ["$$zoneIds", []] }] }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            city: 1,
                            country: 1
                        }
                    }
                ],
                as: "vendorProfile.zones"
            }
        });

        // For backward compatibility, pick the first zone as 'zone'
        pipeline.push({
            $addFields: {
                "vendorProfile.zone": { $arrayElemAt: ["$vendorProfile.zones", 0] }
            }
        });

        /* package services */
        pipeline.push({
            $lookup: {
                from: "categories",
                localField: "services",
                foreignField: "_id",
                as: "services",
            },
        });

        /* services */
        pipeline.push({
            $lookup: {
                from: "categories",
                let: { serviceIds: "$vendorProfile.services" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ["$_id", "$$serviceIds"] }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            image: 1
                        }
                    }
                ],
                as: "vendorProfile.services"
            }
        });

        /* specialised */
        pipeline.push({
            $lookup: {
                from: "categories",
                let: { specialisedId: "$vendorProfile.specialised" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$_id", "$$specialisedId"] }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            image: 1
                        }
                    }
                ],
                as: "vendorProfile.specialised"
            }
        });

        pipeline.push({
            $unwind: {
                path: "$vendorProfile.specialised",
                preserveNullAndEmptyArrays: true
            }
        });
        /* =====================================================
           REMOVE SENSITIVE DATA
        ===================================================== */
        pipeline.push({
            $project: {
                "provider.password": 0,
                "provider.refreshToken": 0,
                "provider.otp": 0,
            },
        });

        /* =====================================================
           SORT + PAGINATION
        ===================================================== */
        const dataPipeline = [
            ...pipeline,
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
        ];

        const packages = await Mehandi.aggregate(dataPipeline);

        /* =====================================================
           COUNT PIPELINE
        ===================================================== */
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Mehandi.aggregate(countPipeline);
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
// exports.getMehandiPackageById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ success: false, message: "Invalid package ID" });
//     }

//     const pkg = await Mehandi.findById(id)
//       .populate("provider", "firstName lastName email phone")
//       .populate("secondaryModule", "title");

//     if (!pkg) {
//       return res.status(404).json({ success: false, message: "Package not found" });
//     }

//     res.json({
//       success: true,
//       data: pkg,
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };


exports.getMehandiPackageById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid package ID"
            });
        }

        const pkg = await Mehandi.findById(id)
            .populate({
                path: "provider",
                select: "firstName lastName email phone profilePhoto",
                populate: {
                    path: "vendorProfile",
                    match: { status: "approved", isActive: true },
                    populate: [
                        {
                            path: "zones",
                            select: "_id name city country"
                        },
                        {
                            path: "services",
                            select: "_id title image"
                        },
                        {
                            path: "specialised",
                            select: "_id title image"
                        }
                    ]
                }
            })
            .populate({
                path: "secondaryModule",
                select: "_id title icon"
            })
            .populate("services", "_id title image icon");

        if (!pkg) {
            return res.status(404).json({
                success: false,
                message: "Package not found"
            });
        }

        if (pkg && pkg.provider && !pkg.provider.profilePhoto && pkg.provider.vendorProfile?.logo) {
            pkg.provider.profilePhoto = pkg.provider.vendorProfile.logo;
        }

        if (pkg && pkg.provider && pkg.provider.vendorProfile) {
            pkg.provider.vendorProfile.zone = pkg.provider.vendorProfile.zones?.[0] || null;
        }

        res.json({
            success: true,
            data: pkg
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


/* =====================================================
   GET PACKAGES BY VENDOR
===================================================== */
// exports.getMehandiByVendor = async (req, res) => {
//   try {
//     const { vendorId } = req.params; 
//     if (!mongoose.Types.ObjectId.isValid(vendorId)) {
//       return res.status(400).json({ success: false, message: "Invalid vendor ID" });
//     }

//     const packages = await Mehandi.find({ provider: vendorId })
//       .populate("secondaryModule", "title")
//       .populate("provider", "firstName lastName email phone")
//       .sort({ createdAt: -1 });

//     res.json({
//       success: true,
//       count: packages.length,
//       data: packages,
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.getMehandiByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vendor ID"
            });
        }

        const packages = await Mehandi.find({
            provider: vendorId,
            isActive: true
        })
            .populate({
                path: "provider",
                select: "firstName lastName email phone profilePhoto",
                populate: {
                    path: "vendorProfile",
                    populate: [
                        {
                            path: "zones",
                            select: "_id name city country"
                        },
                        {
                            path: "services",
                            select: "_id title image"
                        },
                        {
                            path: "specialised",
                            select: "_id title image"
                        }
                    ]
                }
            })
            .populate({
                path: "secondaryModule",
                select: "_id title icon"
            })
            .populate("services", "title image icon")
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
// exports.getMehandiVendors = async (req, res) => {
//   try {
//     const { moduleId } = req.params;

//     const vendors = await Mehandi.aggregate([
//       { $match: { secondaryModule: new mongoose.Types.ObjectId(moduleId) } },
//       { $group: { _id: "$provider", packageCount: { $sum: 1 } } }
//     ]);

//     const vendorIds = vendors.map(v => v._id);

//     const users = await User.find({ _id: { $in: vendorIds } })
//       .select("firstName lastName email phone");

//     const final = users.map(user => {
//       const countObj = vendors.find(v => v._id.toString() === user._id.toString());
//       return {
//         ...user.toObject(),
//         packageCount: countObj?.packageCount || 0,
//       };
//     });

//     res.json({
//       success: true,
//       count: final.length,
//       data: final,
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.getMehandiVendors = async (req, res) => {
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
           1️⃣ Build Profile Filter
        ================================= */
        let profileMatch = {
            // Check BOTH possible field names in VendorProfile just in case
            $or: [
                { module: new mongoose.Types.ObjectId(moduleId) },
                { secondaryModule: new mongoose.Types.ObjectId(moduleId) }
            ],
            // Relaxed status filter to match Photography module behavior
            // status: "approved", 
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

        /* ================================
           2️⃣ Get Vendor Profiles
        ================================= */
        const vendorProfiles = await VendorProfile.find(profileMatch)
            .select("user storeName logo coverImage zones storeAddress latitude longitude services specialised status isActive")
            .populate("zones", "name")
            .populate("services", "title icon slug")
            .populate("specialised", "title icon slug")
            .lean();

        if (vendorProfiles.length === 0) {
            return res.json({
                success: true,
                count: 0,
                data: []
            });
        }

        const vendorIds = vendorProfiles.map(v => v.user);

        /* ================================
           3️⃣ Get Package Counts for These Vendors
        ================================= */
        const packageCountsAgg = await Mehandi.aggregate([
            {
                $match: {
                    $or: [
                        { secondaryModule: new mongoose.Types.ObjectId(moduleId) },
                        { module: new mongoose.Types.ObjectId(moduleId) }
                    ],
                    provider: { $in: vendorIds },
                    isActive: true
                }
            },
            {
                $group: {
                    _id: "$provider",
                    count: { $sum: 1 }
                }
            }
        ]);

        /* ================================
           4️⃣ Get User Details
        ================================= */
        const users = await User.find({ _id: { $in: vendorIds } })
            .select("firstName lastName email phone profilePhoto")
            .lean();

        /* ================================
           4.5️⃣ Get Subscriptions (for premium/multi-zone)
        ================================= */
        const subscriptions = await Subscription.find({
            userId: { $in: vendorIds },
            isCurrent: true
        })
            .populate("planId")
            .populate("moduleId", "title icon")
            .lean();

        /* ================================
           5️⃣ Assemble Final Response
        ================================= */
        const final = users.map(user => {
            const vp = vendorProfiles.find(v => v.user.toString() === user._id.toString());
            const pkgCountItem = packageCountsAgg.find(p => p._id.toString() === user._id.toString());
            const packageCount = pkgCountItem ? pkgCountItem.count : 0;

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
                profilePhoto: user.profilePhoto || vp?.logo || "",
                packageCount,
                storeName: vp?.storeName || `${user.firstName} ${user.lastName}`,
                zone: vp?.zones?.[0] || null,
                zones: vp?.zones || [],
                storeAddress: vp?.storeAddress || null,
                categories: vp?.services || [],
                specialised: vp?.specialised || null,
                latitude: vp?.latitude || null,
                longitude: vp?.longitude || null,
                _needsZoneLookup: (!vp?.zones || vp.zones.length === 0),

                // 🔥 SUBSCRIPTION (for premium multi-zone display)
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

        // ✅ Include all vendors assigned to the module
        const result = final;

        // ✅ GEOGRAPHIC FALLBACK: If zone is STILL null, try to find nearest district by coordinates
        const stillMissingZones = result.filter(v => !v.zone && v.latitude && v.longitude);
        if (stillMissingZones.length > 0) {
            const Zone = mongoose.model("Zone");
            const allZones = await Zone.find({ isActive: true }).select("name").lean();

            for (const vendor of stillMissingZones) {
                try {
                    // A. GEOGRAPHIC FALLBACK (requires coordinates)
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
                                if (possibleName) {
                                    const matchedZone = allZones.find(z =>
                                        z.name.toLowerCase() === possibleName.toLowerCase()
                                    );
                                    vendor.zone = matchedZone || { _id: null, name: possibleName };
                                }
                            }
                            if (!vendor.storeAddress || !vendor.storeAddress.city) {
                                vendor.storeAddress = {
                                    ...vendor.storeAddress,
                                    city: nearestPincode.city || vendor.zone?.name
                                };
                            }
                        }
                    }

                    // B. ADDRESS STRING MATCHING (If still null, search in address text)
                    if (!vendor.zone) {
                        const addressText = `${vendor.storeAddress?.fullAddress || ""} ${vendor.storeAddress?.city || ""} ${vendor.storeAddress?.street || ""}`.toLowerCase();
                        
                        let searchStr = addressText;
                        if (searchStr.includes("calicut")) searchStr += " kozhikode";
                        if (searchStr.includes("kochi") || searchStr.includes("cochin")) searchStr += " ernakulam";
                        if (searchStr.includes("trivandrum")) searchStr += " thiruvananthapuram";

                        const matchedZone = allZones.find(z => 
                            searchStr.includes(z.name.toLowerCase())
                        );

                        if (matchedZone) {
                            vendor.zone = matchedZone;
                        }
                    }
                } catch (geoErr) {
                    console.error("Fallback error for vendor:", vendor._id, geoErr.message);
                }
            }
        }

        // Cleanup internal flags
        result.forEach(v => delete v._needsZoneLookup);

        res.json({
            success: true,
            count: result.length,
            data: result,
        });

    } catch (err) {
        console.error("Get Mehandi Vendors Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};
/* =====================================================
   UPDATE PACKAGE
===================================================== */
exports.updateMehandiPackage = async (req, res) => {
    try {
        const pkg = await Mehandi.findById(req.params.id);
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
                // If it's an array of length 1 containing a string that looks like a JSON array, unpack it
                if (Array.isArray(rawSvc) && rawSvc.length === 1 && typeof rawSvc[0] === 'string' && rawSvc[0].trim().startsWith('[')) {
                    rawSvc = rawSvc[0];
                }

                if (typeof rawSvc === 'string') {
                    let clean = rawSvc.trim();
                    if (clean.startsWith('[') && clean.endsWith(']')) {
                        // Replace single quotes with double quotes for valid JSON
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

        if (req.file) {
            deleteFileIfExists(path.join(__dirname, "../../", pkg.image));
            pkg.image = `/uploads/mehandi/${req.file.filename}`;
        }

        pkg.updatedBy = updatedBy || pkg.updatedBy;

        await pkg.save();

        const populatedPkg = await Mehandi.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("services", "title image icon")
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
exports.deleteMehandiPackage = async (req, res) => {
    try {
        const pkg = await Mehandi.findById(req.params.id);
        if (!pkg)
            return res.status(404).json({ success: false, message: "Package not found" });

        deleteFileIfExists(path.join(__dirname, "../../", pkg.image));

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
   TOGGLE ACTIVE
===================================================== */
exports.toggleActiveStatus = async (req, res) => {
    try {
        const pkg = await Mehandi.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        pkg.isActive = !pkg.isActive;
        await pkg.save();

        const populatedPkg = await Mehandi.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("provider", "firstName lastName email phone");

        res.json({ success: true, data: populatedPkg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   TOGGLE TOP PICK
===================================================== */
exports.toggleTopPickStatus = async (req, res) => {
    try {
        const pkg = await Mehandi.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        pkg.isTopPick = !pkg.isTopPick;
        await pkg.save();

        const populatedPkg = await Mehandi.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("provider", "firstName lastName email phone");

        res.json({ success: true, data: populatedPkg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};