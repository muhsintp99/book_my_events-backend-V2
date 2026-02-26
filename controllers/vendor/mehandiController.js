const Mehandi = require("../../models/vendor/mehandiPackageModel");
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
    } = req.body;

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
      image,
    });

    const populatedPkg = await Mehandi.findById(pkg._id)
      .populate("secondaryModule", "title")
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

      /* ---------- filters ---------- */
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
          "vendorProfile.zone": new mongoose.Types.ObjectId(zoneId),
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

    /* zone */
    pipeline.push({
      $lookup: {
        from: "zones",
        let: { zoneId: "$vendorProfile.zone" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$zoneId"] }
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
        as: "vendorProfile.zone"
      }
    });

    pipeline.push({
      $unwind: {
        path: "$vendorProfile.zone",
        preserveNullAndEmptyArrays: true
      }
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
              path: "zone",
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
      });

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: "Package not found"
      });
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
              path: "zone",
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
       1️⃣ Get Providers With Packages
    ================================= */
    const vendorsAgg = await Mehandi.aggregate([
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

    /* ================================
       2️⃣ Build Profile Filter
    ================================= */
    let profileMatch = {
      status: "approved",
      isActive: true
    };

    if (zoneId && mongoose.Types.ObjectId.isValid(zoneId)) {
      profileMatch.zone = new mongoose.Types.ObjectId(zoneId);
    }

    if (city) {
      profileMatch["storeAddress.city"] = {
        $regex: city,
        $options: "i"
      };
    }

    if (address) {
      profileMatch["storeAddress.fullAddress"] = {
        $regex: address,
        $options: "i"
      };
    }

    /* ================================
       3️⃣ Populate Vendor Profile
    ================================= */
    const users = await User.find({ _id: { $in: vendorIds } })
      .select("firstName lastName email phone profilePhoto")
      .populate({
        path: "vendorProfile",
        match: profileMatch,
        populate: [
          {
            path: "zone",
            select: "name"
          },
          {
            path: "services",
            select: "title icon slug"
          },
          {
            path: "specialised",
            select: "title icon slug"
          }
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
        profilePhoto: user.profilePhoto,

        packageCount: countObj?.packageCount || 0,

        storeName: user.vendorProfile.storeName,

        zone: user.vendorProfile.zone,
        storeAddress: user.vendorProfile.storeAddress,

        // ✅ Categories Added
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
      updatedBy,
    } = req.body;

    if (packageName) pkg.packageName = packageName;
    if (description) pkg.description = description;
    if (packagePrice) pkg.packagePrice = packagePrice;
    if (advanceBookingAmount) pkg.advanceBookingAmount = advanceBookingAmount;

    if (req.file) {
      deleteFileIfExists(path.join(__dirname, "../../", pkg.image));
      pkg.image = `/uploads/mehandi/${req.file.filename}`;
    }

    pkg.updatedBy = updatedBy || pkg.updatedBy;

    await pkg.save();

    const populatedPkg = await Mehandi.findById(pkg._id)
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