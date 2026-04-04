const Booking = require('../../models/vendor/Booking');
const Payment = require('../../models/admin/Payment');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const asyncHandler = require('../../utils/asyncHandler');
const mongoose = require('mongoose');
const User = require('../../models/User');
const VendorProfile = require('../../models/vendor/vendorProfile');
const Package = require('../../models/admin/Package');


/**
 * ADMIN ALL-ROUND REPORT
 * - User/Vendor Counts
 * - Booking lifecycle stats
 * - Revenue
 * - Package overview
 */
exports.getAdminAllAroundReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = {};
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // 1. User/Vendor Totals
  const totalUsers = await User.countDocuments({ role: 'customer' });
  const totalVendors = await VendorProfile.countDocuments({ status: 'approved' });
  const pendingVendors = await VendorProfile.countDocuments({ status: 'pending' });

  // 2. Booking Lifecycle Stats
  const bookingLifecycle = await Booking.aggregate([
    { $match: filter },
    { $group: {
        _id: '$status',
        count: { $sum: 1 },
        revenue: { $sum: '$finalPrice' }
      }
    }
  ]);

  // 3. Package Count (Aggregated across platform)
  // Note: Since packages are in multiple models, we use the core Package model as a representative or sum others if needed
  const corePackageCount = await Package.countDocuments();

  // 4. Payment Stats
  const paymentStats = await Payment.aggregate([
    { $match: { status: 'success' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  return successResponse(res, {
    platform: {
      users: totalUsers,
      activeVendors: totalVendors,
      pendingApproval: pendingVendors,
      platformPackages: corePackageCount
    },
    bookings: bookingLifecycle,
    totalSubsRevenue: paymentStats[0]?.total || 0
  }, 'Admin comprehensive report fetched');
});

/**
 * VENDOR ALL-ROUND REPORT
 * - Booking details (Pending, Accepted, Rejected, Cancelled)
 * - Earnings
 * - Package highlights
 */
exports.getVendorAllAroundReport = asyncHandler(async (req, res) => {
  const vendorId = req.params.vendorId || req.user?._id;
  if (!vendorId) return errorResponse(res, 'Vendor ID required', 400);
  
  const vId = new mongoose.Types.ObjectId(vendorId);

  // 1. Booking Stats
  const bookingStats = await Booking.aggregate([
    { $match: { providerId: vId } },
    { $group: {
        _id: '$status',
        count: { $sum: 1 },
        amount: { $sum: '$finalPrice' }
      }
    }
  ]);

  // 2. Payment Status Summary
  const paymentStatus = await Booking.aggregate([
    { $match: { providerId: vId } },
    { $group: {
        _id: '$paymentStatus',
        count: { $sum: 1 },
        amount: { $sum: '$finalPrice' }
      }
    }
  ]);

  // 3. Recent Activity (Latest 5 Bookings)
  const recentActivity = await Booking.find({ providerId: vId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('userId', 'firstName lastName')
    .lean();

  return successResponse(res, {
    bookingAnalysis: bookingStats,
    paymentAnalysis: paymentStatus,
    recentActivity
  }, 'Vendor comprehensive report fetched');
});

/**
 * ADMIN PAYMENT REPORT (Existing but improved)
 */
exports.getAdminPaymentReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const filter = {};
  
  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // 1. Subscription Revenue Summary
  const subscriptionStats = await Payment.aggregate([
    { $match: { ...filter, status: 'success' } },
    { $group: { 
        _id: null, 
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // 2. Booking Revenue Summary
  const bookingStats = await Booking.aggregate([
    { $match: { ...filter, paymentStatus: 'completed' } },
    { $group: { 
        _id: null, 
        total: { $sum: '$finalPrice' },
        count: { $sum: 1 }
      }
    }
  ]);

  // 3. Monthly Breakdown (Last 12 Months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyBreakdown = await Booking.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo }, paymentStatus: 'completed' } },
    { $group: { 
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        revenue: { $sum: '$finalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // 4. Recent Transactions
  const recentBookings = await Booking.find({ paymentStatus: 'completed' })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('providerId', 'firstName lastName')
    .populate('userId', 'firstName lastName')
    .lean();

  const subRevenue = subscriptionStats[0]?.total || 0;
  const bRevenue = bookingStats[0]?.total || 0;

  return successResponse(res, {
    summary: {
      totalRevenue: subRevenue + bRevenue,
      subscriptionRevenue: subRevenue,
      bookingRevenue: bRevenue,
      subscriptionCount: subscriptionStats[0]?.count || 0,
      bookingCount: bookingStats[0]?.count || 0
    },
    monthlyBreakdown,
    recentTransactions: recentBookings
  }, 'Admin payment report fetched successfully');
});

/**
 * VENDOR PAYMENT REPORT (Existing but improved)
 */
exports.getVendorPaymentReport = asyncHandler(async (req, res) => {
  const vendorId = req.params.vendorId || req.user?._id;
  if (!vendorId) return errorResponse(res, 'Vendor ID is required', 400);

  const vId = new mongoose.Types.ObjectId(vendorId);

  // 1. Vendor Earning Summary
  const earningStats = await Booking.aggregate([
    { $match: { providerId: vId, paymentStatus: 'completed' } },
    { $group: { 
        _id: null, 
        totalEarnings: { $sum: '$finalPrice' },
        totalOrders: { $sum: 1 }
      }
    }
  ]);

  // 2. Pending Payments (Accepted but not yet completed/paid)
  const pendingStats = await Booking.aggregate([
    { $match: { providerId: vId, status: 'Accepted', paymentStatus: 'pending' } },
    { $group: { 
        _id: null, 
        pendingAmount: { $sum: '$finalPrice' },
        pendingOrders: { $sum: 1 }
      }
    }
  ]);

  // 3. Monthly Earnings Breakdown
  const monthlyEarnings = await Booking.aggregate([
    { $match: { providerId: vId, paymentStatus: 'completed' } },
    { $group: { 
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        earnings: { $sum: '$finalPrice' },
        bookings: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // 4. Recent Transactions for this Vendor
  const recentTransactions = await Booking.find({ providerId: vId })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('userId', 'firstName lastName email')
    .lean();

  return successResponse(res, {
    summary: {
      totalEarnings: earningStats[0]?.totalEarnings || 0,
      totalOrders: earningStats[0]?.totalOrders || 0,
      pendingAmount: pendingStats[0]?.pendingAmount || 0,
      pendingOrders: pendingStats[0]?.pendingOrders || 0
    },
    monthlyBreakdown: monthlyEarnings,
    recentTransactions
  }, 'Vendor payment report fetched successfully');
});

