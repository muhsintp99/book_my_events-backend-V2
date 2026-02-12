const Enquiry = require("../../models/vendor/Enquiry");
const Venue = require("../../models/vendor/Venue");
const Transport = require("../../models/vendor/Vehicle");
const Catering = require("../../models/vendor/Catering");
const Makeup = require("../../models/admin/makeupPackageModel");
const Photography = require("../../models/vendor/PhotographyPackage");
const Cake = require("../../models/vendor/cakePackageModel");
const Ornament = require("../../models/vendor/ornamentPackageModel");
const Boutique = require("../../models/vendor/boutiquePackageModel");

/* ======================================================
   🔥 UNIVERSAL PACKAGE RESOLVER
====================================================== */
const resolvePackageDetails = async (moduleTitle, packageId) => {
  if (!moduleTitle || !packageId) return null;

  try {
    if (moduleTitle === "Venues") {
      return await Venue.findById(packageId)
        .populate({
          path: "categories",
          select: "title image categoryId isActive",
          populate: { path: "module", select: "title moduleId" },
        })
        .populate("provider", "userId firstName lastName email profile")
        .populate("createdBy", "email");
    }

    if (moduleTitle === "Transport") {
      return await Transport.findById(packageId)
        .populate("provider", "userId firstName lastName email profile")
        .populate("createdBy", "email");
    }

    if (moduleTitle === "Catering") {
      return await Catering.findById(packageId)
        .populate("provider", "userId firstName lastName email profile")
        .populate("createdBy", "email");
    }

    if (moduleTitle === "Makeup Artist") {
      return await Makeup.findById(packageId)
        .populate("provider", "userId firstName lastName email profile");
    }

    if (moduleTitle === "Photography") {
      return await Photography.findById(packageId)
        .populate("provider", "userId firstName lastName email profile");
    }

    if (moduleTitle === "Cakes" || moduleTitle === "Cake") {
      return await Cake.findById(packageId)
        .populate("provider", "userId firstName lastName email profile");
    }

    if (moduleTitle === "Ornaments" || moduleTitle === "Ornament") {
      return await Ornament.findById(packageId)
        .populate("provider", "userId firstName lastName email profile");
    }

    if (moduleTitle === "Boutique") {
      return await Boutique.findById(packageId)
        .populate("provider", "userId firstName lastName email profile");
    }

    return null;
  } catch (err) {
    console.error(`❌ resolvePackageDetails error:`, err.message);
    return null;
  }
};

const VENDOR_POPULATION = {
  path: "vendorId",
  select: "firstName lastName email",
  populate: [
    { path: "profile", select: "vendorName" },
    { path: "vendorProfile", select: "storeName" }
  ]
};

/* ======================================================
   CREATE ENQUIRY
====================================================== */
exports.createEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.create(req.body);
    const populated = await Enquiry.findById(enquiry._id)
      .populate("moduleId", "title icon")
      .populate(VENDOR_POPULATION)
      .populate("userId", "firstName lastName email");

    const packageDetails = await resolvePackageDetails(
      populated.moduleId?.title,
      populated.packageId
    );

    res.status(201).json({
      success: true,
      data: { ...populated.toObject(), packageDetails },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ======================================================
   GET ALL ENQUIRIES
====================================================== */
exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .populate("moduleId", "title icon")
      .populate(VENDOR_POPULATION)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (e) => {
        try {
          return {
            ...e.toObject(),
            packageDetails: await resolvePackageDetails(e.moduleId?.title, e.packageId),
          };
        } catch (innerErr) {
          return { ...e.toObject(), packageDetails: null };
        }
      })
    );
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ======================================================
   GET SINGLE ENQUIRY
====================================================== */
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id)
      .populate("moduleId", "title icon")
      .populate(VENDOR_POPULATION)
      .populate("userId", "firstName lastName email");

    if (!enquiry) return res.status(404).json({ success: false, message: "Enquiry not found" });

    const packageDetails = await resolvePackageDetails(enquiry.moduleId?.title, enquiry.packageId);
    res.json({ success: true, data: { ...enquiry.toObject(), packageDetails } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ======================================================
   GET BY MODULE / PROVIDER / USER
====================================================== */
exports.getEnquiriesByModule = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ moduleId: req.params.moduleId })
      .populate("moduleId", "title icon")
      .populate(VENDOR_POPULATION)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (e) => ({
        ...e.toObject(),
        packageDetails: await resolvePackageDetails(e.moduleId?.title, e.packageId),
      }))
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getEnquiriesByProvider = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ vendorId: req.params.providerId })
      .populate("moduleId", "title icon")
      .populate(VENDOR_POPULATION)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (e) => ({
        ...e.toObject(),
        packageDetails: await resolvePackageDetails(e.moduleId?.title, e.packageId),
      }))
    );
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getEnquiriesByUser = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({
      $or: [{ userId: req.params.userId }, { vendorId: req.params.userId }]
    })
      .populate("moduleId", "title icon")
      .populate(VENDOR_POPULATION)
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (e) => {
        try {
          return {
            ...e.toObject(),
            packageDetails: await resolvePackageDetails(e.moduleId?.title, e.packageId),
          };
        } catch (innerErr) {
          return { ...e.toObject(), packageDetails: null };
        }
      })
    );
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", detail: error.message });
  }
};

/* ======================================================
   UPDATE / DELETE
====================================================== */
exports.updateEnquiry = async (req, res) => {
  try {
    const updated = await Enquiry.findByIdAndUpdate(req.params.enquiryId, req.body, { new: true })
      .populate("moduleId", "title icon")
      .populate(VENDOR_POPULATION)
      .populate("userId", "firstName lastName email");
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteEnquiry = async (req, res) => {
  try {
    await Enquiry.findByIdAndDelete(req.params.enquiryId);
    res.json({ success: true, message: "Enquiry deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};