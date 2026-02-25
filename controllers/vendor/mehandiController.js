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
exports.getAllMehandiPackages = async (req, res) => {
  try {
    const {
      keyword,
      moduleId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};

    if (keyword) {
      query.packageName = { $regex: keyword, $options: "i" };
    }

    if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
      query.secondaryModule = moduleId;
    }

    if (minPrice) {
      query.packagePrice = { ...query.packagePrice, $gte: Number(minPrice) };
    }

    if (maxPrice) {
      query.packagePrice = { ...query.packagePrice, $lte: Number(maxPrice) };
    }

    const skip = (page - 1) * limit;

    const packages = await Mehandi.find(query)
      .populate("provider", "firstName lastName email phone")
      .populate("secondaryModule", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Mehandi.countDocuments(query);

    res.json({
      success: true,
      count: packages.length,
      total,
      totalPages: Math.ceil(total / limit),
      page: Number(page),
      data: packages,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   GET SINGLE PACKAGE BY ID
===================================================== */
exports.getMehandiPackageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid package ID" });
    }

    const pkg = await Mehandi.findById(id)
      .populate("provider", "firstName lastName email phone")
      .populate("secondaryModule", "title");

    if (!pkg) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    res.json({
      success: true,
      data: pkg,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   GET PACKAGES BY VENDOR
===================================================== */
exports.getMehandiByVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ success: false, message: "Invalid vendor ID" });
    }

    const packages = await Mehandi.find({ provider: vendorId })
      .populate("secondaryModule", "title")
      .populate("provider", "firstName lastName email phone")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: packages.length,
      data: packages,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =====================================================
   GET VENDORS WITH PACKAGE COUNT
===================================================== */
exports.getMehandiVendors = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const vendors = await Mehandi.aggregate([
      { $match: { secondaryModule: new mongoose.Types.ObjectId(moduleId) } },
      { $group: { _id: "$provider", packageCount: { $sum: 1 } } }
    ]);

    const vendorIds = vendors.map(v => v._id);

    const users = await User.find({ _id: { $in: vendorIds } })
      .select("firstName lastName email phone");

    const final = users.map(user => {
      const countObj = vendors.find(v => v._id.toString() === user._id.toString());
      return {
        ...user.toObject(),
        packageCount: countObj?.packageCount || 0,
      };
    });

    res.json({
      success: true,
      count: final.length,
      data: final,
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