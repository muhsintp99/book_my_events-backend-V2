const Booking = require("../../models/vendor/Booking");
const Enquiry = require("../../models/vendor/Enquiry"); // Added Enquiry model
const User = require("../../models/User");
const Module = require("../../models/admin/module");
const Profile = require("../../models/vendor/Profile");
const mongoose = require("mongoose");

// Helper to calculate percentage growth
const calculateGrowth = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // 1. Total Earnings (Module Specific)
    const earningsData = await Booking.aggregate([
      { $match: { moduleId: new mongoose.Types.ObjectId(moduleId), status: "Accepted" } },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]);
    const totalEarnings = earningsData.length > 0 ? earningsData[0].total : 0;

    // 2. Total Orders (Module Specific)
    const totalOrders = await Booking.countDocuments({ moduleId: new mongoose.Types.ObjectId(moduleId) });

    // 3. Total Enquiries (Module Specific)
    const totalEnquiries = await Enquiry.countDocuments({ moduleId: new mongoose.Types.ObjectId(moduleId) });

    // 3. Income Growth (Module Specific)
    const currentMonthEarnings = await Booking.aggregate([
      { 
        $match: { 
          moduleId: new mongoose.Types.ObjectId(moduleId), 
          status: "Accepted",
          createdAt: { $gte: startOfMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]);

    const lastMonthEarnings = await Booking.aggregate([
      { 
        $match: { 
          moduleId: new mongoose.Types.ObjectId(moduleId), 
          status: "Accepted",
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        } 
      },
      { $group: { _id: null, total: { $sum: "$finalPrice" } } }
    ]);

    const currentIncome = currentMonthEarnings.length > 0 ? currentMonthEarnings[0].total : 0;
    const lastIncome = lastMonthEarnings.length > 0 ? lastMonthEarnings[0].total : 0;
    const growthRate = calculateGrowth(currentIncome, lastIncome);

    res.json({
      success: true,
      data: {
        moduleTitle,
        totalEarnings,
        totalOrders,
        totalEnquiries, // Added totalEnquiries
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

    // 2. Active Vendors (Platform wide)
    const activeVendors = await User.countDocuments({ role: "vendor", isBlocked: false });

    // 3. Platform Growth (Total Earnings last month vs this month)
    const now = new Date();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, now.getMonth(), 1);
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
