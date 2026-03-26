const Booking = require("../../models/vendor/Booking");
const Enquiry = require("../../models/vendor/Enquiry"); // Added Enquiry model
const User = require("../../models/User");
const Module = require("../../models/admin/module");
const Profile = require("../../models/vendor/Profile");
const VendorProfile = require("../../models/vendor/vendorProfile"); // Added VendorProfile model
const Package = require("../../models/admin/Package");
const MakeupPackage = require("../../models/admin/makeupPackageModel");
const PhotographyPackage = require("../../models/vendor/PhotographyPackage");
const BouncerPackage = require("../../models/vendor/bouncerPackageModel");
const BoutiquePackage = require("../../models/vendor/boutiquePackageModel");
const CakePackage = require("../../models/vendor/cakePackageModel");
const EmceePackage = require("../../models/vendor/emceePackageModel");
const EventProfessionalPackage = require("../../models/vendor/eventProfessionalPackageModel");
const FloristPackage = require("../../models/vendor/floristPackageModel");
const InvitationPackage = require("../../models/vendor/invitationPackageModel");
const LightAndSoundPackage = require("../../models/vendor/lightAndSoundPackageModel");
const MehandiPackage = require("../../models/vendor/mehandiPackageModel");
const OrnamentPackage = require("../../models/vendor/ornamentPackageModel");
const PanthalDecorationPackage = require("../../models/vendor/panthalDecorationPackageModel");
const Catering = require("../../models/vendor/Catering");
const Vehicle = require("../../models/vendor/Vehicle");
const SecondaryModule = require("../../models/admin/secondarymodule"); // Added SecondaryModule
const mongoose = require("mongoose");

// Helper to calculate percentage growth
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

const getPackageCount = async (moduleTitle, moduleId) => {
  const title = moduleTitle.toLowerCase();
  let model;

  if (title.includes('venue') || title.includes('auditorium')) model = Package;
  else if (title.includes('makeup')) model = MakeupPackage;
  else if (title.includes('photography')) model = PhotographyPackage;
  else if (title.includes('bouncer')) model = BouncerPackage;
  else if (title.includes('boutique')) model = BoutiquePackage;
  else if (title.includes('cake')) model = CakePackage;
  else if (title.includes('emcee')) model = EmceePackage;
  else if (title.includes('professional')) model = EventProfessionalPackage;
  else if (title.includes('florist') || title.includes('stage')) model = FloristPackage;
  else if (title.includes('invitation')) model = InvitationPackage;
  else if (title.includes('light')) model = LightAndSoundPackage;
  else if (title.includes('mehandi')) model = MehandiPackage;
  else if (title.includes('ornament')) model = OrnamentPackage;
  else if (title.includes('panthal')) model = PanthalDecorationPackage;
  else if (title.includes('catering')) model = Catering;
  else if (title.includes('vehicle') || title.includes('transport')) model = Vehicle;

  if (!model) return 0;

  try {
    const query = {
      $or: [
        { module: new mongoose.Types.ObjectId(moduleId) },
        { module: moduleId },
        { secondaryModule: new mongoose.Types.ObjectId(moduleId) },
        { secondaryModule: moduleId },
        { moduleId: new mongoose.Types.ObjectId(moduleId) },
        { moduleId: moduleId }
      ]
    };
    return await model.countDocuments(query);
  } catch (err) {
    console.error(`Error counting packages for ${moduleTitle}:`, err);
    return 0;
  }
};
exports.getModuleStats = async (req, res) => {
  try {
    const { moduleId } = req.query;

    if (!moduleId || !mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({ success: false, message: "Valid Module ID is required" });
    }

    // Fetch Module Title
    let moduleInfo = await Module.findById(moduleId);
    if (!moduleInfo) {
       const SecondaryModule = require("../../models/admin/secondarymodule");
       moduleInfo = await SecondaryModule.findById(moduleId);
    }
    const moduleTitle = moduleInfo ? moduleInfo.title : "Unknown";
    console.log("Resolved Module Title:", moduleTitle);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // 1. Total Earnings (Module Specific)
    const earningsData = await Booking.aggregate([
      { 
        $match: { 
          $or: [
            { moduleId: new mongoose.Types.ObjectId(moduleId) },
            { moduleId: moduleId }
          ], 
          status: "Accepted" 
        } 
      },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]);
    const totalEarnings = earningsData.length > 0 ? earningsData[0].total : 0;

    // 2. Total Orders (Module Specific)
    const totalOrders = await Booking.countDocuments({ 
      $or: [
        { moduleId: new mongoose.Types.ObjectId(moduleId) },
        { moduleId: moduleId }
      ]
    });
    // 3. Total Enquiries (Module Specific)
    const totalEnquiries = await Enquiry.countDocuments({ 
      $or: [
        { moduleId: new mongoose.Types.ObjectId(moduleId) },
        { moduleId: moduleId }
      ]
    });

    // 3. Income Growth (Module Specific)
    const currentMonthEarnings = await Booking.aggregate([
      { 
        $match: { 
          $or: [
            { moduleId: new mongoose.Types.ObjectId(moduleId) },
            { moduleId: moduleId }
          ], 
          status: "Accepted",
          createdAt: { $gte: startOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]);

    const lastMonthEarnings = await Booking.aggregate([
      { 
        $match: { 
          $or: [
            { moduleId: new mongoose.Types.ObjectId(moduleId) },
            { moduleId: moduleId }
          ], 
          status: "Accepted",
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]);

    const currentIncome = currentMonthEarnings.length > 0 ? currentMonthEarnings[0].total : 0;
    const lastIncome = lastMonthEarnings.length > 0 ? lastMonthEarnings[0].total : 0;
    const growthRate = calculateGrowth(currentIncome, lastIncome);

    // 4. Active Vendors for this module (Strictly counting those with active/trial subscriptions)
    const activeVendors = await VendorProfile.countDocuments({ 
      $or: [
        { module: new mongoose.Types.ObjectId(moduleId) },
        { module: moduleId }
      ], 
      status: "approved", 
      isActive: true,
      subscriptionStatus: { $in: ["active", "trial"] }
    });

    // Total Vendors (including non-active/unapproved)
    const totalVendors = await VendorProfile.countDocuments({ 
      $or: [
        { module: new mongoose.Types.ObjectId(moduleId) },
        { module: moduleId }
      ] 
    });

    // Total Packages for this module
    const totalPackages = await getPackageCount(moduleTitle, moduleId);

    const currentMonthEnquiries = await Enquiry.countDocuments({ 
      $or: [
        { moduleId: new mongoose.Types.ObjectId(moduleId) },
        { moduleId: moduleId }
      ], 
      createdAt: { $gte: startOfMonth } 
    });

    // 5. Identify if this is an enquiry-based module
    const isEnquiryModule = ['light', 'bouncer', 'emcee', 'event host', 'panthal', 'professional'].some(m => 
      moduleTitle.toLowerCase().includes(m)
    );

    // 6. Top Vendors for this module
    let topVendors = [];
    if (isEnquiryModule) {
      topVendors = await Enquiry.aggregate([
        { 
          $match: { 
             $or: [
                { moduleId: new mongoose.Types.ObjectId(moduleId) },
                { moduleId: moduleId }
             ] 
          } 
        },
        { $group: { _id: "$vendorId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "vendorprofiles",
            localField: "_id",
            foreignField: "user",
            as: "profile"
          }
        },
        { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ["$profile.storeName", "Unknown Shop"] },
            bookings: "$count"
          }
        }
      ]);
    } else {
      topVendors = await Booking.aggregate([
        { 
          $match: { 
             $or: [
                { moduleId: new mongoose.Types.ObjectId(moduleId) },
                { moduleId: moduleId }
             ] 
          } 
        },
        { $group: { _id: "$providerId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "vendorprofiles",
            localField: "_id",
            foreignField: "user",
            as: "profile"
          }
        },
        { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: { $ifNull: ["$profile.storeName", "Unknown Shop"] },
            bookings: "$count"
          }
        }
      ]);
    }

    res.json({
      success: true,
      data: {
        moduleTitle,
        totalEarnings,
        totalOrders,
        totalEnquiries,
        currentMonthEnquiries,
        activeVendors,
        totalVendors,
        totalPackages,
        topVendors, // Added top vendors for this module
        growthRate: growthRate.toFixed(2),
        currentMonthIncome: currentIncome
      }
    });
  } catch (error) {
    console.error("Get Module Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOverallStats = async (req, res) => {
  try {
    // 1. Total Bookings (Platform wide)
    const totalBookings = await Booking.countDocuments();
    const earningsData = await Booking.aggregate([
      { $match: { status: "Accepted" } },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]);
    const totalEarnings = earningsData.length > 0 ? earningsData[0].total : 0;

    // 2. Active Vendors (Platform wide - strictly counting active/trial subscriptions)
    const activeVendors = await VendorProfile.countDocuments({ 
      status: "approved", 
      isActive: true, 
      subscriptionStatus: { $in: ["active", "trial"] }
    });
    // Total Vendors (including non-active/unapproved)
    const totalVendors = await VendorProfile.countDocuments();

    // 2a. Monthly Counts (Platform wide)
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, now.getMonth(), 1);
    
    const currentMonthOrders = await Booking.countDocuments({ createdAt: { $gte: startOfMonth } });
    const currentMonthEnquiries = await Enquiry.countDocuments({ createdAt: { $gte: startOfMonth } });

    const startOfLastMonth = new Date(currentYear, now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(currentYear, now.getMonth(), 0);

    const currentMonthData = await Booking.aggregate([
      { $match: { status: "Accepted", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]);
    const lastMonthData = await Booking.aggregate([
      { $match: { status: "Accepted", createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]);

    const currentIncome = currentMonthData.length > 0 ? currentMonthData[0].total : 0;
    const lastIncome = lastMonthData.length > 0 ? lastMonthData[0].total : 0;
    const overallGrowth = calculateGrowth(currentIncome, lastIncome);

    // 4. Monthly Statistics (For Bar Chart)
    const startOfYear = new Date(currentYear, 0, 1);
    const monthlyStats = await Booking.aggregate([
      { $match: { createdAt: { $gte: startOfYear } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          revenue: { $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, "$finalPrice", 0] } },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);

    // Fill missing months with zeros
    const fullMonthlyStats = Array.from({ length: 12 }, (_, i) => {
      const found = monthlyStats.find(s => s._id.month === i + 1);
      return {
        month: i + 1,
        revenue: found ? found.revenue : 0,
        bookings: found ? found.bookings : 0
      };
    });

    // 5. Top Booked Modules
    const topModules = await Booking.aggregate([
      {
        $group: {
          _id: "$moduleId",
          bookings: { $sum: 1 }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "modules", // matches the collection name of Module model
          localField: "_id",
          foreignField: "_id",
          as: "moduleInfo"
        }
      },
      { $unwind: "$moduleInfo" },
      {
        $project: {
          name: "$moduleInfo.title",
          bookings: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        activeVendors,
        totalVendors, // Added total vendors
        totalEarnings,
        currentMonthOrders,
        currentMonthEnquiries,
        overallGrowth: overallGrowth.toFixed(2),
        monthlyStats: fullMonthlyStats,
        topModules
      }
    });
  } catch (error) {
    console.error("Get Overall Stats Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
