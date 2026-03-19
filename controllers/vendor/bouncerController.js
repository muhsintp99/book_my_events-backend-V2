const Bouncer = require("../../models/vendor/bouncerPackageModel");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const mongoose = require("mongoose");
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
exports.createBouncerPackage = async (req, res) => {
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
                if (typeof services === 'string') {
                    let clean = services.trim();
                    if (clean.startsWith('[') && clean.endsWith(']')) {
                        clean = clean.replace(/'/g, '"');
                        parsedServices = JSON.parse(clean);
                    } else if (clean.includes(',')) {
                        parsedServices = clean.split(',').map(s => s.trim());
                    } else if (clean) {
                        parsedServices = [clean];
                    }
                } else {
                    parsedServices = Array.isArray(services) ? services : [services];
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

        const packageId = `BNC-${Date.now()}`;

        const image = req.file
            ? `/Uploads/bouncer/${req.file.filename}`
            : null;

        const pkg = await Bouncer.create({
            packageId,
            secondaryModule: secondaryModule || module,
            provider: providerId,
            packageName,
            description,
            packagePrice,
            advanceBookingAmount,
            image,
            services: parsedServices,
        });

        const populatedPkg = await Bouncer.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("provider", "firstName lastName email phone")
            .populate("services", "title image");

        res.status(201).json({
            success: true,
            message: "Bouncer package created successfully",
            data: populatedPkg,
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   GET ALL PACKAGES (SEARCH + FILTER + PAGINATION)
===================================================== */
exports.getAllBouncerPackages = async (req, res) => {
    try {
        const {
            keyword,
            moduleId,
            minPrice,
            maxPrice,
            zoneId,
            city,
            address,
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
                    // "vendorProfile.status": "approved", // Permanent fix for Bouncers
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
                    "vendorProfile.storeAddress.city": {
                        $regex: city,
                        $options: "i",
                    },
                },
            });
        }

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
                from: "zones",
                let: { zoneIds: "$vendorProfile.zones" },
                pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$zoneIds"] } } },
                    { $project: { _id: 1, name: 1, city: 1, country: 1 } }
                ],
                as: "vendorProfile.zones"
            }
        });

        pipeline.push({
            $addFields: {
                "vendorProfile.zone": { $arrayElemAt: ["$vendorProfile.zones", 0] }
            }
        });

        pipeline.push({
            $lookup: {
                from: "categories",
                let: { serviceIds: "$vendorProfile.services" },
                pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$serviceIds"] } } },
                    { $project: { _id: 1, title: 1, image: 1 } }
                ],
                as: "vendorProfile.services"
            }
        });

        pipeline.push({
            $lookup: {
                from: "categories",
                let: { specialisedId: "$vendorProfile.specialised" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$specialisedId"] } } },
                    { $project: { _id: 1, title: 1, image: 1 } }
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

        pipeline.push({
            $project: {
                "provider.password": 0,
                "provider.refreshToken": 0,
                "provider.otp": 0,
            },
        });

        pipeline.push({
            $lookup: {
                from: "categories",
                localField: "services",
                foreignField: "_id",
                as: "services"
            }
        });

        const dataPipeline = [
            ...pipeline,
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: Number(limit) },
        ];

        const packages = await Bouncer.aggregate(dataPipeline);

        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await Bouncer.aggregate(countPipeline);
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
exports.getBouncerPackageById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid package ID"
            });
        }

        const pkg = await Bouncer.findById(id)
            .populate({
                path: "provider",
                select: "firstName lastName email phone profilePhoto",
                populate: {
                    path: "vendorProfile",
                    match: {
                        // status: "approved", // 💡 Relaxed for testing
                        isActive: true
                    },
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
            .populate("services", "_id title image icon isActive");

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
exports.getBouncerByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vendor ID"
            });
        }

        const packages = await Bouncer.find({
            provider: vendorId,
            isActive: true
        })
            .populate({
                path: "provider",
                select: "firstName lastName email phone profilePhoto",
                populate: {
                    path: "vendorProfile",
                    populate: [
                        { path: "zone", select: "_id name city country" },
                        { path: "services", select: "_id title image" },
                        { path: "specialised", select: "_id title image" }
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
exports.getBouncerVendors = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { zoneId, city, address } = req.query;

        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid module ID"
            });
        }

        const vendorsAgg = await Bouncer.aggregate([
            {
                $match: {
                    secondaryModule: new mongoose.Types.ObjectId(moduleId),
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

        const vendorIds = vendorsAgg.map(v => v._id);

        let profileMatch = {
            // status: "approved", // 💡 Relaxed for testing: allow pending vendors to show in lists
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

        const users = await User.find({ _id: { $in: vendorIds } })
            .select("firstName lastName email phone profilePhoto")
            .populate({
                path: "vendorProfile",
                match: profileMatch,
                populate: [
                    { path: "zones", select: "name" },
                    { path: "services", select: "title icon slug" },
                    { path: "specialised", select: "title icon slug" }
                ]
            });

        const filteredUsers = users.filter(u => u.vendorProfile);

        const final = filteredUsers.map(user => {
            const countObj = vendorsAgg.find(
                v => v._id.toString() === user._id.toString()
            );

            return {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                profilePhoto: user.profilePhoto || user.vendorProfile?.logo || "",

                packageCount: countObj?.packageCount || 0,
                storeName: user.vendorProfile.storeName,
                zone: user.vendorProfile.zones?.[0] || null,
                zones: user.vendorProfile.zones || [],
                storeAddress: user.vendorProfile.storeAddress,

                categories: user.vendorProfile.services,
                specialised: user.vendorProfile.specialised,

                latitude: user.vendorProfile.latitude,
                longitude: user.vendorProfile.longitude
            };
        });

        res.json({
            success: true,
            count: final.length,
            data: final
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   UPDATE PACKAGE
===================================================== */
exports.updateBouncerPackage = async (req, res) => {
    try {
        const pkg = await Bouncer.findById(req.params.id);
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
                if (typeof services === 'string') {
                    let clean = services.trim();
                    if (clean.startsWith('[') && clean.endsWith(']')) {
                        clean = clean.replace(/'/g, '"');
                        parsedServices = JSON.parse(clean);
                    } else if (clean.includes(',')) {
                        parsedServices = clean.split(',').map(s => s.trim());
                    } else if (clean) {
                        parsedServices = [clean];
                    }
                } else {
                    parsedServices = Array.isArray(services) ? services : [services];
                }
            } catch (e) {
                console.error("Services parsing error:", e);
                parsedServices = [];
            }
            pkg.services = parsedServices;
        }

        if (req.file) {
            deleteFileIfExists(path.join(__dirname, "../../", pkg.image));
            pkg.image = `/Uploads/bouncer/${req.file.filename}`;
        }

        pkg.updatedBy = updatedBy || pkg.updatedBy;

        await pkg.save();

        const populatedPkg = await Bouncer.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("provider", "firstName lastName email phone")
            .populate("services", "title image icon");

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
exports.deleteBouncerPackage = async (req, res) => {
    try {
        const pkg = await Bouncer.findById(req.params.id);
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
        const pkg = await Bouncer.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        pkg.isActive = !pkg.isActive;
        await pkg.save();

        const populatedPkg = await Bouncer.findById(pkg._id)
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
        const pkg = await Bouncer.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        pkg.isTopPick = !pkg.isTopPick;
        await pkg.save();

        const populatedPkg = await Bouncer.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("provider", "firstName lastName email phone");

        res.json({ success: true, data: populatedPkg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
