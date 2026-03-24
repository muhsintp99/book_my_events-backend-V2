// const EventProfessional = require("../../models/vendor/eventProfessionalPackageModel");
// const VendorProfile = require("../../models/vendor/vendorProfile");
// const User = require("../../models/User");
// const Pincode = require("../../models/vendor/Pincode");
// const mongoose = require("mongoose");
// const fs = require("fs");
// const path = require("path");

// /* =====================================================
//    HELPER: Delete Image
// ===================================================== */
// const deleteFileIfExists = (filePath) => {
//     if (filePath && fs.existsSync(filePath)) {
//         try {
//             const absolutePath = filePath.startsWith("/")
//                 ? path.join(__dirname, "../../", filePath)
//                 : filePath;
//             if (fs.existsSync(absolutePath)) {
//                 fs.unlinkSync(absolutePath);
//             }
//         } catch (err) {
//             console.error(`Error deleting file: ${filePath}`, err);
//         }
//     }
// };

// /* =====================================================
//    CREATE PACKAGE
// ===================================================== */
// exports.createEventProfessionalPackage = async (req, res) => {
//     try {
//         const {
//             secondaryModule,
//             module,
//             providerId,
//             packageName,
//             description,
//             packagePrice,
//             advanceBookingAmount,
//             services
//         } = req.body;

//         let parsedServices = [];
//         if (services) {
//             try {
//                 // Handle various string formats: JSON, single-quoted array, or comma-separated list
//                 if (typeof services === 'string') {
//                     let clean = services.trim();
//                     if (clean.startsWith('[') && clean.endsWith(']')) {
//                         // Replace common non-standard JSON quotes
//                         clean = clean.replace(/'/g, '"');
//                         parsedServices = JSON.parse(clean);
//                     } else if (clean.includes(',')) {
//                         parsedServices = clean.split(',').map(s => s.trim());
//                     } else if (clean) {
//                         parsedServices = [clean];
//                     }
//                 } else {
//                     parsedServices = Array.isArray(services) ? services : [services];
//                 }
//             } catch (e) {
//                 console.error("Services parsing error:", e);
//                 parsedServices = []; // Default to empty if parsing fails
//             }
//         }

//         if (!packageName)
//             return res.status(400).json({ success: false, message: "Package name required" });

//         if (!providerId)
//             return res.status(400).json({ success: false, message: "Provider required" });

//         const packageId = `EVP-${Date.now()}`;

//         const image = req.file
//             ? `/Uploads/event-professional/${req.file.filename}`
//             : null;

//         const pkg = await EventProfessional.create({
//             packageId,
//             secondaryModule: secondaryModule || module,
//             provider: providerId,
//             packageName,
//             description,
//             packagePrice,
//             advanceBookingAmount,
//             image,
//             services: parsedServices
//         });

//         const populatedPkg = await EventProfessional.findById(pkg._id)
//             .populate("secondaryModule", "title")
//             .populate("services", "title image")
//             .populate("provider", "firstName lastName email phone");

//         res.status(201).json({
//             success: true,
//             message: "Event Professional package created successfully",
//             data: populatedPkg,
//         });

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// /* =====================================================
//    GET ALL PACKAGES (SEARCH + FILTER + PAGINATION)
// ===================================================== */
// exports.getAllEventProfessionalPackages = async (req, res) => {
//     try {
//         const {
//             keyword,
//             moduleId,
//             minPrice,
//             maxPrice,
//             zoneId,
//             city,
//             address,
//             page = 1,
//             limit = 10,
//             categoryId
//         } = req.query;

//         const skip = (page - 1) * limit;

//         let matchStage = { isActive: true };

//         if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
//             matchStage.services = new mongoose.Types.ObjectId(categoryId);
//         }

//         if (keyword) {
//             matchStage.packageName = { $regex: keyword, $options: "i" };
//         }

//         if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
//             matchStage.secondaryModule = new mongoose.Types.ObjectId(moduleId);
//         }

//         if (minPrice) {
//             matchStage.packagePrice = { ...matchStage.packagePrice, $gte: Number(minPrice) };
//         }

//         if (maxPrice) {
//             matchStage.packagePrice = { ...matchStage.packagePrice, $lte: Number(maxPrice) };
//         }

//         const pipeline = [
//             { $match: matchStage },
//             {
//                 $lookup: {
//                     from: "users",
//                     localField: "provider",
//                     foreignField: "_id",
//                     as: "provider",
//                 },
//             },
//             { $unwind: "$provider" },
//             {
//                 $lookup: {
//                     from: "vendorprofiles",
//                     localField: "provider._id",
//                     foreignField: "user",
//                     as: "vendorProfile",
//                 },
//             },
//             { $unwind: "$vendorProfile" },
//             {
//                 $addFields: {
//                     "provider.profilePhoto": {
//                         $cond: {
//                             if: { $or: [{ $eq: ["$provider.profilePhoto", ""] }, { $not: ["$provider.profilePhoto"] }] },
//                             then: { $ifNull: ["$vendorProfile.logo", ""] },
//                             else: "$provider.profilePhoto"
//                         }
//                     }
//                 }
//             },
//             {
//                 $match: {
//                     "vendorProfile.isActive": true,
//                 },
//             },
//         ];

//         if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
//             pipeline.push({
//                 $match: {
//                     "vendorProfile.zones": new mongoose.Types.ObjectId(zoneId),
//                 },
//             });
//         }

//         if (city) {
//             pipeline.push({
//                 $match: {
//                     "vendorProfile.storeAddress.city": { $regex: city, $options: "i" },
//                 },
//             });
//         }

//         if (address) {
//             pipeline.push({
//                 $match: {
//                     "vendorProfile.storeAddress.fullAddress": { $regex: address, $options: "i" },
//                 },
//             });
//         }

//         pipeline.push({
//             $lookup: {
//                 from: "secondarymodules",
//                 localField: "secondaryModule",
//                 foreignField: "_id",
//                 as: "secondaryModule",
//             },
//         });
//         pipeline.push({ $unwind: "$secondaryModule" });

//         pipeline.push({
//             $project: {
//                 "provider.password": 0,
//                 "provider.refreshToken": 0,
//                 "provider.otp": 0,
//             },
//         });

//         const dataPipeline = [
//             ...pipeline,
//             { $sort: { createdAt: -1 } },
//             { $skip: skip },
//             { $limit: Number(limit) },
//         ];

//         const packages = await EventProfessional.aggregate(dataPipeline);

//         const countPipeline = [...pipeline, { $count: "total" }];
//         const countResult = await EventProfessional.aggregate(countPipeline);
//         const total = countResult[0]?.total || 0;

//         res.json({
//             success: true,
//             total,
//             page: Number(page),
//             totalPages: Math.ceil(total / limit),
//             data: packages,
//         });

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// /* =====================================================
//    GET SINGLE PACKAGE BY ID
// ===================================================== */
// exports.getEventProfessionalPackageById = async (req, res) => {
//     try {
//         const { id } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({ success: false, message: "Invalid package ID" });
//         }

//         const pkg = await EventProfessional.findById(id)
//             .populate({
//                 path: "provider",
//                 select: "firstName lastName email phone profilePhoto",
//                 populate: {
//                     path: "vendorProfile",
//                     match: {
//                         isActive: true
//                     },
//                     populate: [
//                         { path: "zones", select: "_id name city country" },
//                         { path: "services", select: "_id title image" },
//                         { path: "specialised", select: "_id title image" }
//                     ]
//                 }
//             })
//             .populate({
//                 path: "secondaryModule",
//                 select: "_id title icon"
//             })
//             .populate({
//                 path: "services",
//                 select: "_id title image"
//             });

//         if (!pkg) {
//             return res.status(404).json({ success: false, message: "Package not found" });
//         }

//         if (pkg && pkg.provider && !pkg.provider.profilePhoto && pkg.provider.vendorProfile?.logo) {
//             pkg.provider.profilePhoto = pkg.provider.vendorProfile.logo;
//         }

//         if (pkg && pkg.provider && pkg.provider.vendorProfile) {
//             pkg.provider.vendorProfile.zone = pkg.provider.vendorProfile.zones?.[0] || null;
//         }

//         res.json({ success: true, data: pkg });

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// /* =====================================================
//    GET PACKAGES BY VENDOR
// ===================================================== */
// exports.getEventProfessionalByVendor = async (req, res) => {
//     try {
//         const { vendorId } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(vendorId)) {
//             return res.status(400).json({ success: false, message: "Invalid vendor ID" });
//         }

//         const packages = await EventProfessional.find({
//             provider: vendorId
//         })
//             .populate({
//                 path: "provider",
//                 select: "firstName lastName email phone profilePhoto",
//                 populate: {
//                     path: "vendorProfile",
//                     populate: [
//                         { path: "zone", select: "_id name city country" },
//                         { path: "services", select: "_id title image" },
//                         { path: "specialised", select: "_id title image" }
//                     ]
//                 }
//             })
//             .populate({
//                 path: "secondaryModule",
//                 select: "_id title icon"
//             })
//             .populate({
//                 path: "services",
//                 select: "_id title image"
//             })
//             .sort({ createdAt: -1 });

//         packages.forEach(pkg => {
//             if (pkg.provider && !pkg.provider.profilePhoto && pkg.provider.vendorProfile?.logo) {
//                 pkg.provider.profilePhoto = pkg.provider.vendorProfile.logo;
//             }
//             if (pkg.provider && pkg.provider.vendorProfile) {
//                 pkg.provider.vendorProfile.zone = pkg.provider.vendorProfile.zones?.[0] || null;
//             }
//         });

//         res.json({
//             success: true,
//             count: packages.length,
//             data: packages
//         });

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// /* =====================================================
//    GET VENDORS WITH PACKAGE COUNT
// ===================================================== */
// exports.getEventProfessionalVendors = async (req, res) => {
//     try {
//         const { moduleId } = req.params;
//         const { zoneId, city, address } = req.query;

//         if (!mongoose.Types.ObjectId.isValid(moduleId)) {
//             return res.status(400).json({ success: false, message: "Invalid module ID" });
//         }

//         /* ================================
//            1️⃣ Get Providers With Packages
//         ================================= */
//         const vendorsAgg = await EventProfessional.aggregate([
//             {
//                 $match: {
//                     secondaryModule: new mongoose.Types.ObjectId(moduleId),
//                     isActive: true
//                 }
//             },
//             {
//                 $group: {
//                     _id: "$provider",
//                     packageCount: { $sum: 1 }
//                 }
//             }
//         ]);

//         const vendorIds = vendorsAgg.map(v => v._id);

//         /* ================================
//            2️⃣ Build Profile Filter
//         ================================= */
//         let profileMatch = {
//             isActive: true
//         };

//         if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
//             profileMatch.zones = new mongoose.Types.ObjectId(zoneId);
//         }

//         if (city) {
//             profileMatch["storeAddress.city"] = { $regex: city, $options: "i" };
//         }

//         if (address) {
//             profileMatch["storeAddress.fullAddress"] = { $regex: address, $options: "i" };
//         }

//         /* ================================
//            3️⃣ Populate Vendor Profile
//         ================================= */
//         const users = await User.find({ _id: { $in: vendorIds } })
//             .select("firstName lastName email phone profilePhoto")
//             .populate({
//                 path: "vendorProfile",
//                 match: profileMatch,
//                 populate: [
//                     { path: "zones", select: "name" },
//                     { path: "services", select: "title icon slug" },
//                     { path: "specialised", select: "title icon slug" }
//                 ]
//             });

//         const filteredUsers = users.filter(u => u.vendorProfile);

//         const final = filteredUsers.map(user => {
//             const countObj = vendorsAgg.find(
//                 v => v._id.toString() === user._id.toString()
//             );

//             const vp = user.vendorProfile || {};
//             return {
//                 _id: user._id,
//                 firstName: user.firstName,
//                 lastName: user.lastName,
//                 email: user.email,
//                 phone: user.phone,
//                 profilePhoto: user.profilePhoto || vp.logo || "",
//                 packageCount: countObj?.packageCount || 0,
//                 storeName: vp.storeName,
//                 zone: vp.zones?.[0] || null,
//                 zones: vp.zones || [],
//                 storeAddress: vp.storeAddress,
//                 categories: vp.services,
//                 specialised: vp.specialised,
//                 latitude: vp.latitude,
//                 longitude: vp.longitude,
//                 _needsZoneLookup: !vp.zones || vp.zones.length === 0
//             };
//         });

//         // ✅ STAGE 2: CROSS-PROFILE FALLBACK
//         const vendorsNeedingZones = final.filter(v => v._needsZoneLookup);
//         if (vendorsNeedingZones.length > 0) {
//             const idsNeedingZones = vendorsNeedingZones.map(v => v._id);
//             const otherProfiles = await VendorProfile.find({
//                 user: { $in: idsNeedingZones },
//                 status: "approved",
//                 isActive: true,
//                 zones: { $exists: true, $ne: [] }
//             })
//             .select("user zones storeAddress")
//             .populate("zones", "name")
//             .lean();

//             for (const vendor of vendorsNeedingZones) {
//                 const otherVp = otherProfiles.find(p => p.user.toString() === vendor._id.toString());
//                 if (otherVp && otherVp.zones && otherVp.zones.length > 0) {
//                     vendor.zone = otherVp.zones[0];
//                     vendor.zones = otherVp.zones;
//                 }
//                 if (!vendor.storeAddress && otherVp?.storeAddress) {
//                     vendor.storeAddress = otherVp.storeAddress;
//                 }
//             }
//         }

//         // Remove internal flag
//         final.forEach(v => delete v._needsZoneLookup);

//         // ✅ STAGE 3: FINAL FALLBACKS (Geography and Address Parsing)
//         const zoneMissing = final.filter(v => !v.zone);
//         if (zoneMissing.length > 0) {
//             const Zone = mongoose.model("Zone");
//             const allZones = await Zone.find({ isActive: true }).select("name").lean();
            
//             for (const vendor of zoneMissing) {
//                 try {
//                     if (vendor.latitude && vendor.longitude) {
//                         const nearestPincode = await Pincode.findOne({
//                             location: {
//                                 $near: {
//                                     $geometry: {
//                                         type: "Point",
//                                         coordinates: [parseFloat(vendor.longitude), parseFloat(vendor.latitude)],
//                                     },
//                                     $maxDistance: 50000,
//                                 },
//                             },
//                         })
//                         .populate("zone_id", "name")
//                         .lean();

//                         if (nearestPincode) {
//                             if (nearestPincode.zone_id) {
//                                 vendor.zone = nearestPincode.zone_id;
//                             } else {
//                                 const possibleName = nearestPincode.city || nearestPincode.state;
//                                 const matchedZone = allZones.find(z => z.name.toLowerCase() === possibleName?.toLowerCase());
//                                 vendor.zone = matchedZone || { _id: null, name: possibleName };
//                             }
//                             if (!vendor.storeAddress || !vendor.storeAddress.city) {
//                                 vendor.storeAddress = { ...vendor.storeAddress, city: nearestPincode.city || vendor.zone?.name };
//                             }
//                         }
//                     }

//                     if (!vendor.zone) {
//                         const addressText = `${vendor.storeAddress?.fullAddress || ""} ${vendor.storeAddress?.city || ""} ${vendor.storeAddress?.street || ""}`.toLowerCase();
//                         let searchStr = addressText;
//                         if (searchStr.includes("calicut")) searchStr += " kozhikode";
//                         if (searchStr.includes("kochi") || searchStr.includes("cochin")) searchStr += " ernakulam";
//                         if (searchStr.includes("trivandrum")) searchStr += " thiruvananthapuram";

//                         const matchedZone = allZones.find(z => searchStr.includes(z.name.toLowerCase()));
//                         if (matchedZone) vendor.zone = matchedZone;
//                     }
//                 } catch (err) {
//                     console.error("Final fallback error for event-prof vendor:", vendor._id, err.message);
//                 }
//             }
//         }

//         res.json({
//             success: true,
//             count: final.length,
//             data: final
//         });

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// /* =====================================================
//    UPDATE PACKAGE
// ===================================================== */
// exports.updateEventProfessionalPackage = async (req, res) => {
//     try {
//         const pkg = await EventProfessional.findById(req.params.id);
//         if (!pkg)
//             return res.status(404).json({ success: false, message: "Package not found" });

//         const {
//             packageName,
//             description,
//             packagePrice,
//             advanceBookingAmount,
//             updatedBy,
//             services,
//         } = req.body;

//         if (packageName) pkg.packageName = packageName;
//         if (description) pkg.description = description;
//         if (packagePrice) pkg.packagePrice = packagePrice;
//         if (advanceBookingAmount) pkg.advanceBookingAmount = advanceBookingAmount;

//         if (services) {
//             try {
//                 let parsedUpdatedServices = [];
//                 if (typeof services === 'string') {
//                     let clean = services.trim();
//                     if (clean.startsWith('[') && clean.endsWith(']')) {
//                         clean = clean.replace(/'/g, '"');
//                         parsedUpdatedServices = JSON.parse(clean);
//                     } else if (clean.includes(',')) {
//                         parsedUpdatedServices = clean.split(',').map(s => s.trim());
//                     } else if (clean) {
//                         parsedUpdatedServices = [clean];
//                     }
//                 } else {
//                     parsedUpdatedServices = Array.isArray(services) ? services : [services];
//                 }
//                 pkg.services = parsedUpdatedServices;
//             } catch (e) {
//                 console.error("Services update parsing error:", e);
//             }
//         }

//         if (req.file) {
//             deleteFileIfExists(pkg.image);
//             pkg.image = `/Uploads/event-professional/${req.file.filename}`;
//         }

//         pkg.updatedBy = updatedBy || pkg.updatedBy;
//         await pkg.save();

//         const populatedPkg = await EventProfessional.findById(pkg._id)
//             .populate("secondaryModule", "title")
//             .populate("services", "title image")
//             .populate("provider", "firstName lastName email phone");

//         res.json({
//             success: true,
//             message: "Package updated successfully",
//             data: populatedPkg,
//         });

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// /* =====================================================
//    DELETE PACKAGE
// ===================================================== */
// exports.deleteEventProfessionalPackage = async (req, res) => {
//     try {
//         const pkg = await EventProfessional.findById(req.params.id);
//         if (!pkg)
//             return res.status(404).json({ success: false, message: "Package not found" });

//         deleteFileIfExists(pkg.image);
//         await pkg.deleteOne();

//         res.json({
//             success: true,
//             message: "Package deleted successfully",
//         });

//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// /* =====================================================
//    TOGGLE STATUSES
// ===================================================== */
// exports.toggleActiveStatus = async (req, res) => {
//     try {
//         const pkg = await EventProfessional.findById(req.params.id);
//         if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

//         pkg.isActive = !pkg.isActive;
//         await pkg.save();
//         res.json({ success: true, data: pkg });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.toggleTopPickStatus = async (req, res) => {
//     try {
//         const pkg = await EventProfessional.findById(req.params.id);
//         if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

//         pkg.isTopPick = !pkg.isTopPick;
//         await pkg.save();
//         res.json({ success: true, data: pkg });
//     } catch (err) {
//         res.status(500).json({ success: false, message: err.message });
//     }
// };


const EventProfessional = require("../../models/vendor/eventProfessionalPackageModel");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
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
   CREATE PACKAGE
===================================================== */
exports.createEventProfessionalPackage = async (req, res) => {
    try {
        const {
            secondaryModule,
            module,
            providerId,
            packageName,
            description,
            packagePrice,
            advanceBookingAmount,
            services
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

        const packageId = `EVP-${Date.now()}`;

        const image = req.file
            ? `/Uploads/event-professional/${req.file.filename}`
            : null;

        const pkg = await EventProfessional.create({
            packageId,
            secondaryModule: secondaryModule || module,
            provider: providerId,
            packageName,
            description,
            packagePrice,
            advanceBookingAmount,
            image,
            services: parsedServices
        });

        const populatedPkg = await EventProfessional.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("services", "title image")
            .populate("provider", "firstName lastName email phone");

        res.status(201).json({
            success: true,
            message: "Event Professional package created successfully",
            data: populatedPkg,
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   GET ALL PACKAGES (SEARCH + FILTER + PAGINATION)
===================================================== */
exports.getAllEventProfessionalPackages = async (req, res) => {
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
            categoryId
        } = req.query;

        const skip = (page - 1) * limit;

        let matchStage = { isActive: true };

        if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
            matchStage.services = new mongoose.Types.ObjectId(categoryId);
        }

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

        const packages = await EventProfessional.aggregate(dataPipeline);

        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await EventProfessional.aggregate(countPipeline);
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
exports.getEventProfessionalPackageById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid package ID" });
        }

        const pkg = await EventProfessional.findById(id)
            .populate({
                path: "provider",
                select: "firstName lastName email phone profilePhoto",
                populate: {
                    path: "vendorProfile",
                    match: { isActive: true },
                    // ✅ FIX: populate 'zones' (array) not 'zone' (doesn't exist in schema)
                    populate: [
                        { path: "zones", select: "_id name city country" },
                        { path: "services", select: "_id title image" },
                        { path: "specialised", select: "_id title image" }
                    ]
                }
            })
            .populate({ path: "secondaryModule", select: "_id title icon" })
            .populate({ path: "services", select: "_id title image" });

        if (!pkg) {
            return res.status(404).json({ success: false, message: "Package not found" });
        }

        if (pkg.provider && !pkg.provider.profilePhoto && pkg.provider.vendorProfile?.logo) {
            pkg.provider.profilePhoto = pkg.provider.vendorProfile.logo;
        }

        // Attach first zone as convenience field
        if (pkg.provider && pkg.provider.vendorProfile) {
            pkg.provider.vendorProfile.zone = pkg.provider.vendorProfile.zones?.[0] || null;
        }

        res.json({ success: true, data: pkg });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   GET PACKAGES BY VENDOR  ← FIXED
===================================================== */
exports.getEventProfessionalByVendor = async (req, res) => {
    try {
        const { vendorId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(vendorId)) {
            return res.status(400).json({ success: false, message: "Invalid vendor ID" });
        }

        const packages = await EventProfessional.find({ provider: vendorId })
            .populate({
                path: "provider",
                select: "firstName lastName email phone profilePhoto",
                populate: {
                    path: "vendorProfile",
                    // ✅ FIX: removed 'zone' (not in schema), use 'zones' only
                    populate: [
                        { path: "zones", select: "_id name city country" },
                        { path: "services", select: "_id title image" },
                        { path: "specialised", select: "_id title image" }
                    ]
                }
            })
            .populate({ path: "secondaryModule", select: "_id title icon" })
            .populate({ path: "services", select: "_id title image" })
            .sort({ createdAt: -1 });

        // Post-process: attach profilePhoto fallback + convenience zone field
        packages.forEach(pkg => {
            if (pkg.provider && !pkg.provider.profilePhoto && pkg.provider.vendorProfile?.logo) {
                pkg.provider.profilePhoto = pkg.provider.vendorProfile.logo;
            }
            if (pkg.provider && pkg.provider.vendorProfile) {
                // ✅ FIX: derive .zone from .zones array instead of populating non-existent field
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
exports.getEventProfessionalVendors = async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { zoneId, city, address } = req.query;

        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ success: false, message: "Invalid module ID" });
        }

        const vendorsAgg = await EventProfessional.aggregate([
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

        let profileMatch = { isActive: true };

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
                // ✅ FIX: use 'zones' not 'zone'
                populate: [
                    { path: "zones", select: "name" },
                    { path: "services", select: "title icon slug" },
                    { path: "specialised", select: "title icon slug" }
                ]
            });

        const filteredUsers = users.filter(u => u.vendorProfile);

        const final = filteredUsers.map(user => {
            const countObj = vendorsAgg.find(v => v._id.toString() === user._id.toString());
            const vp = user.vendorProfile || {};
            return {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                profilePhoto: user.profilePhoto || vp.logo || "",
                packageCount: countObj?.packageCount || 0,
                storeName: vp.storeName,
                // ✅ derive zone from zones array
                zone: vp.zones?.[0] || null,
                zones: vp.zones || [],
                storeAddress: vp.storeAddress,
                categories: vp.services,
                specialised: vp.specialised,
                latitude: vp.latitude,
                longitude: vp.longitude,
                _needsZoneLookup: !vp.zones || vp.zones.length === 0
            };
        });

        // STAGE 2: Cross-profile fallback for vendors missing zones
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

        final.forEach(v => delete v._needsZoneLookup);

        // STAGE 3: Geography + address-text fallback for still-missing zones
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
                    console.error("Final fallback error for event-prof vendor:", vendor._id, err.message);
                }
            }
        }

        res.json({ success: true, count: final.length, data: final });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   UPDATE PACKAGE
===================================================== */
exports.updateEventProfessionalPackage = async (req, res) => {
    try {
        const pkg = await EventProfessional.findById(req.params.id);
        if (!pkg)
            return res.status(404).json({ success: false, message: "Package not found" });

        const { packageName, description, packagePrice, advanceBookingAmount, updatedBy, services } = req.body;

        if (packageName) pkg.packageName = packageName;
        if (description) pkg.description = description;
        if (packagePrice) pkg.packagePrice = packagePrice;
        if (advanceBookingAmount) pkg.advanceBookingAmount = advanceBookingAmount;

        if (services) {
            try {
                let parsedUpdatedServices = [];
                if (typeof services === 'string') {
                    let clean = services.trim();
                    if (clean.startsWith('[') && clean.endsWith(']')) {
                        clean = clean.replace(/'/g, '"');
                        parsedUpdatedServices = JSON.parse(clean);
                    } else if (clean.includes(',')) {
                        parsedUpdatedServices = clean.split(',').map(s => s.trim());
                    } else if (clean) {
                        parsedUpdatedServices = [clean];
                    }
                } else {
                    parsedUpdatedServices = Array.isArray(services) ? services : [services];
                }
                pkg.services = parsedUpdatedServices;
            } catch (e) {
                console.error("Services update parsing error:", e);
            }
        }

        if (req.file) {
            deleteFileIfExists(pkg.image);
            pkg.image = `/Uploads/event-professional/${req.file.filename}`;
        }

        pkg.updatedBy = updatedBy || pkg.updatedBy;
        await pkg.save();

        const populatedPkg = await EventProfessional.findById(pkg._id)
            .populate("secondaryModule", "title")
            .populate("services", "title image")
            .populate("provider", "firstName lastName email phone");

        res.json({ success: true, message: "Package updated successfully", data: populatedPkg });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   DELETE PACKAGE
===================================================== */
exports.deleteEventProfessionalPackage = async (req, res) => {
    try {
        const pkg = await EventProfessional.findById(req.params.id);
        if (!pkg)
            return res.status(404).json({ success: false, message: "Package not found" });

        deleteFileIfExists(pkg.image);
        await pkg.deleteOne();

        res.json({ success: true, message: "Package deleted successfully" });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   TOGGLE STATUSES
===================================================== */
exports.toggleActiveStatus = async (req, res) => {
    try {
        const pkg = await EventProfessional.findById(req.params.id);
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
        const pkg = await EventProfessional.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });
        pkg.isTopPick = !pkg.isTopPick;
        await pkg.save();
        res.json({ success: true, data: pkg });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};