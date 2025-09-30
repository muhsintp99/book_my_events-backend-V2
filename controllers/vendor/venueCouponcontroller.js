import Coupon from '../../models/admin/coupons.js';
import mongoose from 'mongoose';
import { successResponse, errorResponse, paginatedResponse } from '../../utils/responseFormatter.js';

// ===== Get all coupons =====
export const getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, isActive, search } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    let query = Coupon.find(filter)
      .populate('createdBy', 'firstName lastName')
      .populate('applicableCategories', 'title')
      .populate('applicableStores', 'storeName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const coupons = await query;
    const total = await Coupon.countDocuments(filter);

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { coupons }, pagination, 'Coupons fetched successfully');
  } catch (error) {
    console.error('Get coupons error:', error);
    return errorResponse(res, 'Error fetching coupons', 500);
  }
};

// ===== Get single coupon =====
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('applicableCategories', 'title')
      .populate('applicableStores', 'storeName');

    if (!coupon) return errorResponse(res, 'Coupon not found', 404);
    return successResponse(res, { coupon }, 'Coupon fetched successfully');
  } catch (error) {
    console.error('Get coupon error:', error);
    return errorResponse(res, 'Error fetching coupon', 500);
  }
};

// ===== Create coupon =====
export const createCoupon = async (req, res) => {
  try {
    const {
      title,
      code,
      type = 'percentage',
      discount,
      discountType = 'percentage',
      totalUses = 1,
      minPurchase = 0,
      maxDiscount,
      startDate,
      expireDate,
      isActive = true,
      applicableCategories,
      applicableStores
    } = req.body;

    if (!title || !code || !discount) {
      return errorResponse(res, 'Title, code and discount are required', 400);
    }

    if (expireDate && startDate && new Date(expireDate) <= new Date(startDate)) {
      return errorResponse(res, 'Expire date must be after start date', 400);
    }

    // Check duplicate code
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return errorResponse(res, 'Coupon code already exists', 400);

    const coupon = new Coupon({
      title,
      code: code.toUpperCase(),
      type,
      discount: parseFloat(discount),
      discountType,
      totalUses: parseInt(totalUses),
      minPurchase: parseFloat(minPurchase),
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
      startDate: startDate ? new Date(startDate) : new Date(),
      expireDate: expireDate ? new Date(expireDate) : undefined,
      isActive,
      applicableCategories: Array.isArray(applicableCategories) ? applicableCategories : [],
      applicableStores: Array.isArray(applicableStores) ? applicableStores : [],
      createdBy: req.user?._id
    });

    await coupon.save();

    const populatedCoupon = await Coupon.findById(coupon._id)
      .populate('createdBy', 'firstName lastName')
      .populate('applicableCategories', 'title')
      .populate('applicableStores', 'storeName');

    return successResponse(res, { coupon: populatedCoupon }, 'Coupon created successfully', 201);
  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return errorResponse(res, `Validation error: ${messages.join(', ')}`, 400);
    }
    if (error.code === 11000) {
      return errorResponse(res, 'Coupon code already exists', 400);
    }
    return errorResponse(res, 'Error creating coupon', 500);
  }
};

// ===== Update coupon =====
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return errorResponse(res, 'Coupon not found', 404);

    const updateData = { ...req.body };
    delete updateData.code; // prevent code update

    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('createdBy', 'firstName lastName')
      .populate('applicableCategories', 'title')
      .populate('applicableStores', 'storeName');

    return successResponse(res, { coupon: updatedCoupon }, 'Coupon updated successfully');
  } catch (error) {
    console.error('Update coupon error:', error);
    return errorResponse(res, 'Error updating coupon', 500);
  }
};

// ===== Delete coupon =====
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return errorResponse(res, 'Coupon not found', 404);

    await Coupon.findByIdAndDelete(req.params.id);
    return successResponse(res, null, 'Coupon deleted successfully');
  } catch (error) {
    console.error('Delete coupon error:', error);
    return errorResponse(res, 'Error deleting coupon', 500);
  }
};

// ===== Toggle coupon status =====
export const toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return errorResponse(res, 'Coupon not found', 404);

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return successResponse(res, { coupon }, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (error) {
    console.error('Toggle coupon status error:', error);
    return errorResponse(res, 'Error updating coupon status', 500);
  }
};

// ===== Validate coupon =====
export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const now = new Date();

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      expireDate: { $gte: now }
    });

    if (!coupon) return errorResponse(res, 'Invalid or expired coupon code', 404);
    if (coupon.totalUses && coupon.usedCount >= coupon.totalUses) {
      return errorResponse(res, 'Coupon usage limit exceeded', 400);
    }

    return successResponse(res, { coupon }, 'Coupon is valid');
  } catch (error) {
    console.error('Validate coupon error:', error);
    return errorResponse(res, 'Error validating coupon', 500);
  }
};

// ===== Apply coupon =====
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const now = new Date();

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      expireDate: { $gte: now }
    });

    if (!coupon) return errorResponse(res, 'Invalid or expired coupon code', 404);
    if (coupon.totalUses && coupon.usedCount >= coupon.totalUses) {
      return errorResponse(res, 'Coupon usage limit exceeded', 400);
    }

    coupon.usedCount += 1;
    await coupon.save();

    return successResponse(res, { coupon }, 'Coupon applied successfully');
  } catch (error) {
    console.error('Apply coupon error:', error);
    return errorResponse(res, 'Error applying coupon', 500);
  }
};