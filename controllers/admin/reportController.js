const Booking = require('../../models/vendor/Booking');
const Payment = require('../../models/admin/Payment');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const asyncHandler = require('../../utils/asyncHandler');
const mongoose = require('mongoose');

/**
 * ADMIN PAYMENT REPORT
 * - Total Revenue (Bookings + Subscriptions)
 * - Monthly breakdown
 * - Recent transactions
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

  // 3. Monthly Breakdown (Last 6 Months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyBreakdown = await Booking.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo }, paymentStatus: 'completed' } },
    { $group: { 
        _id: { $month: '$createdAt' },
        revenue: { $sum: '$finalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
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
 * VENDOR PAYMENT REPORT
 * - Total Earnings
 * - Pending Payouts
 * - Performance by Module
 */
exports.getVendorPaymentReport = asyncHandler(async (req, res) => {
  const vendorId = req.user?._id || req.query.vendorId; // Support both auth and query for admin view

  if (!vendorId) {
    return errorResponse(res, 'Vendor ID is required', 400);
  }

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
        _id: { $month: '$createdAt' },
        earnings: { $sum: '$finalPrice' },
        bookings: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
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
