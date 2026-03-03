const LightAndSound = require("../../models/vendor/lightAndSoundPackageModel");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

/* =====================================================
   HELPER: Delete File
===================================================== */
const deleteFileIfExists = (filePath) => {
    if (filePath) {
        try {
            // Ensure we are working with an absolute path if it starts with /Uploads or /uploads
            let absolutePath;
            if (filePath.startsWith("/")) {
                absolutePath = path.join(__dirname, "../../", filePath);
            } else {
                absolutePath = path.resolve(filePath);
            }

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
exports.createLightAndSoundPackage = async (req, res) => {
    try {
        const {
            secondaryModule,
            module,
            providerId,
            packageName,
            description,
            packagePrice,
            advanceBookingAmount,
            category,
        } = req.body;

        if (!packageName)
            return res.status(400).json({ success: false, message: "Package name required" });

        if (!providerId)
            return res.status(400).json({ success: false, message: "Provider required" });

        const packageId = `LS-${Date.now()}`;

        // Handle thumbnail
        let thumbnail = null;
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            thumbnail = `/uploads/light-sound/${req.files.thumbnail[0].filename}`;
        }

        // Handle multiple images
        let images = [];
        if (req.files && req.files.images) {
            images = req.files.images.map(file => `/uploads/light-sound/${file.filename}`);
        }

        const pkg = await LightAndSound.create({
            packageId,
            secondaryModule: secondaryModule || module,
            provider: providerId,
            packageName,
            description,
            packagePrice,
            advanceBookingAmount,
            category,
            thumbnail,
            images,
        });

        const populatedPkg = await LightAndSound.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("category", "title image")
            .populate("provider", "firstName lastName email phone");

        res.status(201).json({
            success: true,
            message: "Light and Sound package created successfully",
            data: populatedPkg,
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   GET ALL PACKAGES (SEARCH + FILTER + PAGINATION)
===================================================== */
exports.getAllLightAndSoundPackages = async (req, res) => {
    try {
        const {
            keyword,
            moduleId,
            minPrice,
            maxPrice,
            zoneId,
            city,
            address,
            categoryId,
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

        if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
            matchStage.category = new mongoose.Types.ObjectId(categoryId);
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
                $match: {
                    "vendorProfile.status": "approved",
                    "vendorProfile.isActive": true,
                },
            },
        ];

        if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
            pipeline.push({
                $match: {
                    "vendorProfile.zone": new mongoose.Types.ObjectId(zoneId),
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
                localField: "category",
                foreignField: "_id",
                as: "category",
            },
        });
        pipeline.push({ $unwind: "$category" });

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

        const packages = await LightAndSound.aggregate(dataPipeline);

        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await LightAndSound.aggregate(countPipeline);
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
exports.getLightAndSoundPackageById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid package ID" });
        }

        const pkg = await LightAndSound.findById(id)
            .populate({
                path: "provider",
                select: "firstName lastName email phone profilePhoto",
                populate: {
                    path: "vendorProfile",
                    match: { status: "approved", isActive: true },
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
            .populate({
                path: "category",
                select: "_id title image"
            });


        if (!pkg) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }

        res.json({ success: true, data: pkg });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   GET PACKAGES BY VENDOR
===================================================== */
exports.getLightAndSoundByVendor = async (req, res) => {
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

        const packages = await LightAndSound.find(query)
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
            .populate({
                path: "category",
                select: "_id title image"
            })
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
   UPDATE PACKAGE
===================================================== */
exports.updateLightAndSoundPackage = async (req, res) => {
    try {
        const pkg = await LightAndSound.findById(req.params.id);
        if (!pkg)
            return res.status(404).json({ success: false, message: "Package not found" });

        const {
            packageName,
            description,
            packagePrice,
            advanceBookingAmount,
            category,
            rentalAvailability,
            updatedBy,
        } = req.body;

        if (packageName) pkg.packageName = packageName;
        if (description) pkg.description = description;
        if (packagePrice) pkg.packagePrice = packagePrice;
        if (advanceBookingAmount) pkg.advanceBookingAmount = advanceBookingAmount;
        if (category) pkg.category = category;
        if (rentalAvailability) pkg.rentalAvailability = rentalAvailability;

        // Handle thumbnail update
        if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
            if (pkg.thumbnail) deleteFileIfExists(pkg.thumbnail);
            pkg.thumbnail = `/uploads/light-sound/${req.files.thumbnail[0].filename}`;
        }

        // Handle images update (replaces all images if provided)
        if (req.files && req.files.images && req.files.images.length > 0) {
            if (pkg.images && pkg.images.length > 0) {
                pkg.images.forEach(img => deleteFileIfExists(img));
            }
            pkg.images = req.files.images.map(file => `/uploads/light-sound/${file.filename}`);
        }

        pkg.updatedBy = updatedBy || pkg.updatedBy;

        await pkg.save();

        const populatedPkg = await LightAndSound.findById(pkg._id)
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
exports.deleteLightAndSoundPackage = async (req, res) => {
    try {
        const pkg = await LightAndSound.findById(req.params.id);
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
        const pkg = await LightAndSound.findById(req.params.id);
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
        const pkg = await LightAndSound.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        pkg.isTopPick = !pkg.isTopPick;
        await pkg.save();
        res.json({ success: true, data: pkg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
