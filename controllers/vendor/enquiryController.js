const Enquiry = require("../../models/vendor/Enquiry");
const Venue = require("../../models/vendor/Venue");
const Transport = require("../../models/vendor/Vehicle");
const Catering = require("../../models/vendor/Catering");
const Makeup = require("../../models/admin/makeupPackageModel");
const Photography = require("../../models/vendor/PhotographyPackage");

/* =================================================
   HELPER: RESOLVE PACKAGE DETAILS (ALL MODULES)
================================================= */
const resolvePackageDetails = async (moduleTitle, packageId) => {
  if (!moduleTitle || !packageId) return null;

  // ---------- VENUES ----------
  if (moduleTitle === "Venues") {
    return await Venue.findById(packageId)
      .populate({
        path: "categories",
        select: "title image categoryId isActive",
        populate: {
          path: "module",
          select: "title moduleId",
        },
      })
      .populate({
        path: "packages",
        select:
          "packageId title subtitle description packageType includes price images thumbnail provider isActive createdAt updatedAt",
      })
      .populate("provider", "userId firstName lastName email profile")
      .populate("createdBy", "email");
  }

  // ---------- TRANSPORT ----------
  if (moduleTitle === "Transport") {
    return await Transport.findById(packageId)
      .populate({
        path: "categories",
        select: "title image categoryId isActive",
        populate: {
          path: "module",
          select: "title moduleId",
        },
      })
      .populate("provider", "userId firstName lastName email profile")
      .populate("createdBy", "email");
  }

  // ---------- CATERING ----------
  if (moduleTitle === "Catering") {
    return await Catering.findById(packageId);
  }

  // ---------- MAKEUP ----------
  if (moduleTitle === "Makeup Artist") {
    return await Makeup.findById(packageId);
  }

  // ---------- PHOTOGRAPHY ----------
  if (moduleTitle === "Photography") {
    return await Photography.findById(packageId);
  }

  return null;
};

/* =================================================
   CREATE ENQUIRY
================================================= */
exports.createEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.create(req.body);

    const populated = await Enquiry.findById(enquiry._id)
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email");

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
    console.error("Create Enquiry Error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* =================================================
   GET ALL ENQUIRIES
================================================= */
exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (enquiry) => ({
        ...enquiry.toObject(),
        packageDetails: await resolvePackageDetails(
          enquiry.moduleId?.title,
          enquiry.packageId
        ),
      }))
    );

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get All Enquiries Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =================================================
   GET SINGLE ENQUIRY
================================================= */
exports.getEnquiryById = async (req, res) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id)
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email");

    if (!enquiry) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    res.json({
      success: true,
      data: {
        ...enquiry.toObject(),
        packageDetails: await resolvePackageDetails(
          enquiry.moduleId?.title,
          enquiry.packageId
        ),
      },
    });
  } catch (error) {
    console.error("Get Enquiry Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =================================================
   GET ENQUIRIES BY MODULE
================================================= */
exports.getEnquiriesByModule = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({
      moduleId: req.params.moduleId,
    })
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (enquiry) => ({
        ...enquiry.toObject(),
        packageDetails: await resolvePackageDetails(
          enquiry.moduleId?.title,
          enquiry.packageId
        ),
      }))
    );

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get Enquiries By Module Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =================================================
   GET ENQUIRIES BY PROVIDER
================================================= */
exports.getEnquiriesByProvider = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({
      vendorId: req.params.providerId,
    })
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (enquiry) => ({
        ...enquiry.toObject(),
        packageDetails: await resolvePackageDetails(
          enquiry.moduleId?.title,
          enquiry.packageId
        ),
      }))
    );

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get Enquiries By Provider Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =================================================
   UPDATE ENQUIRY
================================================= */
exports.updateEnquiry = async (req, res) => {
  try {
    const updated = await Enquiry.findByIdAndUpdate(
      req.params.enquiryId,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Update Enquiry Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =================================================
   DELETE ENQUIRY
================================================= */
exports.deleteEnquiry = async (req, res) => {
  try {
    const deleted = await Enquiry.findByIdAndDelete(req.params.enquiryId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Enquiry not found",
      });
    }

    res.json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    console.error("Delete Enquiry Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
