const Enquiry = require("../../models/vendor/Enquiry");
const Venue = require("../../models/vendor/Venue");
const Transport = require("../../models/vendor/Vehicle");
const Catering = require("../../models/vendor/Catering");
const Makeup = require("../../models/admin/makeupPackageModel");
const Photography = require("../../models/vendor/PhotographyPackage");

/* ======================================================
   UNIVERSAL PACKAGE RESOLVER (FIXED)
====================================================== */
const resolvePackageDetails = async (moduleTitle, packageId) => {
  if (!moduleTitle || !packageId) return null;

  if (moduleTitle === "Venues") {
    return await Venue.findById(packageId)
      .populate("provider", "userId firstName lastName email profile");
  }

  if (moduleTitle === "Transport") {
    return await Transport.findById(packageId)
      .populate("provider", "userId firstName lastName email profile");
  }

  if (moduleTitle === "Catering") {
    return await Catering.findById(packageId)
      .populate("provider", "userId firstName lastName email profile");
  }

  if (moduleTitle === "Makeup Artist") {
    return await Makeup.findById(packageId)
      .populate("provider", "userId firstName lastName email profile");
  }

  if (moduleTitle === "Photography") {
    return await Photography.findById(packageId)
      .populate("provider", "userId firstName lastName email profile");
  }

  return null;
};

/* ======================================================
   CREATE ENQUIRY (GUEST + USER SAFE)
====================================================== */
exports.createEnquiry = async (req, res) => {
  try {
    const enquiryData = {
      ...req.body,
    };

    // ✅ attach logged-in user if available
    if (req.user?._id) {
      enquiryData.userId = req.user._id;
    }

    const enquiry = await Enquiry.create(enquiryData);

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
    console.error(error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   GET ALL ENQUIRIES
====================================================== */
exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find()
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email")
      .populate("userId", "firstName lastName email")
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

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    console.error(error);
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
      .populate("vendorId", "firstName lastName email")
      .populate("userId", "firstName lastName email");

    if (!enquiry) {
      return res.status(404).json({ success: false, message: "Not found" });
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
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ======================================================
   GET ENQUIRIES BY MODULE
====================================================== */
exports.getEnquiriesByModule = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ moduleId: req.params.moduleId })
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email")
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (e) => ({
        ...e.toObject(),
        packageDetails: await resolvePackageDetails(
          e.moduleId?.title,
          e.packageId
        ),
      }))
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ======================================================
   GET ENQUIRIES BY PROVIDER
====================================================== */
exports.getEnquiriesByProvider = async (req, res) => {
  try {
    const enquiries = await Enquiry.find({
      vendorId: req.params.providerId,
    })
      .populate("moduleId", "title icon")
      .populate("vendorId", "firstName lastName email")
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const data = await Promise.all(
      enquiries.map(async (e) => ({
        ...e.toObject(),
        packageDetails: await resolvePackageDetails(
          e.moduleId?.title,
          e.packageId
        ),
      }))
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ======================================================
   UPDATE & DELETE
====================================================== */
exports.updateEnquiry = async (req, res) => {
  const updated = await Enquiry.findByIdAndUpdate(
    req.params.enquiryId,
    req.body,
    { new: true }
  );
  res.json({ success: true, data: updated });
};

exports.deleteEnquiry = async (req, res) => {
  await Enquiry.findByIdAndDelete(req.params.enquiryId);
  res.json({ success: true, message: "Enquiry deleted" });
};
