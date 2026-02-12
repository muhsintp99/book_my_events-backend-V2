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
   🔥 UNIVERSAL PACKAGE RESOLVER (CORE FIX)
====================================================== */
const resolvePackageDetails = async (moduleTitle, packageId) => {
  if (!moduleTitle || !packageId) return null;

  try {
    // -------- VENUES --------
    if (moduleTitle === "Venues") {
      return await Venue.findById(packageId)
        .populate({
          path: "categories",
          select: "title image categoryId isActive",
          populate: { path: "module", select: "title moduleId" },
        })
        .populate({
          path: "packages",
          select:
            "packageId title subtitle description packageType includes price images thumbnail provider isActive createdAt updatedAt",
        })
        .populate("provider", "userId firstName lastName email profile")
        .populate("createdBy", "email");
    }

    // -------- TRANSPORT --------
    if (moduleTitle === "Transport") {
      return await Transport.findById(packageId)
        .populate("provider", "userId firstName lastName email profile")
        .populate("createdBy", "email");
    }

    // -------- CATERING --------
    if (moduleTitle === "Catering") {
      return await Catering.findById(packageId)
        .populate("provider", "userId firstName lastName email profile")
        .populate("createdBy", "email");
    }

    // -------- MAKEUP --------
    if (moduleTitle === "Makeup Artist") {
      return await Makeup.findById(packageId)
        .populate("provider", "userId firstName lastName email profile");
    }

    // -------- PHOTOGRAPHY --------
    if (moduleTitle === "Photography") {
      return await Photography.findById(packageId)
        .populate("provider", "userId firstName lastName email profile");
    }

    // -------- CAKE --------
    if (moduleTitle === "Cakes" || moduleTitle === "Cake") {
      return await Cake.findById(packageId)
        .populate("provider", "userId firstName lastName email profile");
    }

    // -------- ORNAMENT --------
    if (moduleTitle === "Ornaments" || moduleTitle === "Ornament") {
      return await Ornament.findById(packageId)
        .populate("provider", "userId firstName lastName email profile");
    }

    // -------- BOUTIQUE --------
    if (moduleTitle === "Boutique") {
      return await Boutique.findById(packageId)
        .populate("provider", "userId firstName lastName email profile");
    }

    console.log(`⚠️ Unhandled module context: ${moduleTitle}`);
    return null;
  } catch (err) {
    console.error(`❌ resolvePackageDetails error for module ${moduleTitle}:`, err.message);
    return null;
  }
};

/* ======================================================
   CREATE ENQUIRY
====================================================== */
exports.createEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.create(req.body);

    const populated = await Enquiry.findById(enquiry._id)
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email")
      .populate("userId", "firstName lastName email");

    const packageDetails = await resolvePackageDetails(
      populated.moduleId?.title,
      populated.packageId
    );

    res.status(201).json({
      success: true,
      message: "Enquiry created successfully",
      data: {
        ...populated.toObject(),
        packageDetails,
      },
    });
  } catch (error) {
    console.error("❌ Create enquiry error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

/* ======================================================
   GET ALL ENQUIRIES
====================================================== */
exports.getAllEnquiries = async (req, res) => {
  try {
    console.log("📋 Fetching all enquiries...");

    const enquiries = await Enquiry.find()
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email businessName profile")
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (e) => {
        try {
          return {
            ...e.toObject(),
            packageDetails: await resolvePackageDetails(
              e.moduleId?.title,
              e.packageId
            ),
          };
        } catch (innerErr) {
          console.error(`❌ Error resolving enquiry ${e._id}:`, innerErr.message);
          return { ...e.toObject(), packageDetails: null };
        }
      })
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("❌ Get all enquiries error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ======================================================
   GET SINGLE ENQUIRY
====================================================== */
exports.getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching enquiry:", id);

    const enquiry = await Enquiry.findById(id)
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email businessName profile")
      .populate("userId", "firstName lastName email");

    if (!enquiry) {
      return res.status(404).json({ success: false, message: "Enquiry not found" });
    }

    const packageDetails = await resolvePackageDetails(
      enquiry.moduleId?.title,
      enquiry.packageId
    );

    res.json({
      success: true,
      data: {
        ...enquiry.toObject(),
        packageDetails,
      },
    });
  } catch (error) {
    console.error("❌ Get enquiry error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ======================================================
   GET BY MODULE
====================================================== */
exports.getEnquiriesByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    console.log("📦 Fetching enquiries for module:", moduleId);

    const enquiries = await Enquiry.find({ moduleId })
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email businessName profile")
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (e) => {
        try {
          return {
            ...e.toObject(),
            packageDetails: await resolvePackageDetails(
              e.moduleId?.title,
              e.packageId
            ),
          };
        } catch (innerErr) {
          return { ...e.toObject(), packageDetails: null };
        }
      })
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("❌ Get by module error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ======================================================
   GET BY PROVIDER (VENDOR)
====================================================== */
exports.getEnquiriesByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;
    console.log("👤 Fetching enquiries for provider:", providerId);

    const enquiries = await Enquiry.find({
      vendorId: providerId,
    })
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email businessName profile")
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (e) => {
        try {
          return {
            ...e.toObject(),
            packageDetails: await resolvePackageDetails(
              e.moduleId?.title,
              e.packageId
            ),
          };
        } catch (innerErr) {
          return { ...e.toObject(), packageDetails: null };
        }
      })
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("❌ Get by provider error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ======================================================
   GET BY USER (CUSTOMER)
====================================================== */
exports.getEnquiriesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("👥 Fetching enquiries for user:", userId);

    const enquiries = await Enquiry.find({
      $or: [
        { userId: userId },
        { vendorId: userId },
      ]
    })
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email businessName profile")
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (e) => {
        try {
          return {
            ...e.toObject(),
            packageDetails: await resolvePackageDetails(
              e.moduleId?.title,
              e.packageId
            ),
          };
        } catch (innerErr) {
          console.error(`❌ resolvePackageDetails failed for ${e._id}:`, innerErr.message);
          return { ...e.toObject(), packageDetails: null };
        }
      })
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("❌ Get by user error:", error.message);
    res.status(500).json({ success: false, message: "Server error", detail: error.message });
  }
};

/* ======================================================
   UPDATE ENQUIRY
====================================================== */
exports.updateEnquiry = async (req, res) => {
  try {
    const { enquiryId } = req.params;
    console.log("✏️ Updating enquiry:", enquiryId);

    const updated = await Enquiry.findByIdAndUpdate(
      enquiryId,
      req.body,
      { new: true }
    )
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email businessName")
      .populate("userId", "firstName lastName email");

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("❌ Update enquiry error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ======================================================
   DELETE ENQUIRY
====================================================== */
exports.deleteEnquiry = async (req, res) => {
  try {
    const { enquiryId } = req.params;
    console.log("🗑️ Deleting enquiry:", enquiryId);

    await Enquiry.findByIdAndDelete(enquiryId);

    res.json({ success: true, message: "Enquiry deleted" });
  } catch (error) {
    console.error("❌ Delete enquiry error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};