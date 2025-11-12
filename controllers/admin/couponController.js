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
      // .populate('applicableStores', 'storeName') // Commented out until Store model is imported
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const coupons = await query;
    const total = await Coupon.countDocuments(filter);

    // Clean response data
    const cleanedCoupons = coupons.map(coupon => {
      const obj = coupon.toObject();
      
      // Remove empty arrays
      if (obj.applicableCategories?.length === 0) delete obj.applicableCategories;
      if (obj.applicableStores?.length === 0) delete obj.applicableStores;
      
      // Remove createdBy details, keep only ID
      if (obj.createdBy) {
        obj.createdBy = obj.createdBy._id || obj.createdBy;
      }
      
      return obj;
    });

    const pagination = {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: parseInt(limit)
    };

    return paginatedResponse(res, { coupons: cleanedCoupons }, pagination, 'Coupons fetched successfully');
  } catch (error) {
    console.error('Get coupons error:', error);
    return errorResponse(res, 'Error fetching coupons', 500);
  }
};



// ===== Get discount by coupon code =====
// ===== Get discount by coupon code =====
export const getDiscountByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const now = new Date();

    // Find coupon by code
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return errorResponse(res, 'Coupon not found', 404);
    }

    // Determine current status
    let status = 'inactive';
    if (!coupon.isActive) {
      status = 'disabled';
    } else if (now < coupon.startDate) {
      status = 'upcoming';
    } else if (now > coupon.expireDate) {
      status = 'expired';
    } else {
      status = 'active';
    }

    // Construct detailed response
    const discountInfo = {
      title: coupon.title,
      code: coupon.code,
      discount: coupon.discount,
      discountType: coupon.discountType,
      type: coupon.type,
      isActive: coupon.isActive,
      startDate: coupon.startDate,
      expireDate: coupon.expireDate,
      status,
      message:
        coupon.discountType === 'percentage'
          ? `${coupon.discount}% discount`
          : `Flat ${coupon.discount} amount off`
    };

    return successResponse(res, { discountInfo }, 'Coupon discount fetched successfully');
  } catch (error) {
    console.error('Get discount by code error:', error);
    return errorResponse(res, 'Error fetching coupon discount', 500);
  }
};


// ===== Get single coupon =====
export const getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('createdBy', 'firstName lastName')
      .populate('applicableCategories', 'title');
      // .populate('applicableStores', 'storeName'); // Commented out until Store model is imported

    if (!coupon) return errorResponse(res, 'Coupon not found', 404);
    
    // Clean response data
    const responseData = coupon.toObject();
    
    // Remove empty arrays
    if (responseData.applicableCategories?.length === 0) delete responseData.applicableCategories;
    if (responseData.applicableStores?.length === 0) delete responseData.applicableStores;
    
    // Remove createdBy details, keep only ID
    if (responseData.createdBy) {
      responseData.createdBy = responseData.createdBy._id || responseData.createdBy;
    }
    
    return successResponse(res, { coupon: responseData }, 'Coupon fetched successfully');
  } catch (error) {
    console.error('Get coupon error:', error);
    return errorResponse(res, 'Error fetching coupon', 500);
  }
};


// ===== Get coupons by module ID =====
export const getCouponsByModuleId = async (req, res) => {
  try {
    const { moduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return errorResponse(res, 'Invalid module ID format', 400);
    }

    const coupons = await Coupon.find({ moduleId })
      .populate('createdBy', 'firstName lastName')
      .populate('applicableCategories', 'title')
      // .populate('applicableStores', 'storeName')
      .sort({ createdAt: -1 });

    if (!coupons || coupons.length === 0) {
      return errorResponse(res, 'No coupons found for this module ID', 404);
    }

    // Clean response data
    const cleanedCoupons = coupons.map(coupon => {
      const obj = coupon.toObject();

      if (obj.applicableCategories?.length === 0) delete obj.applicableCategories;
      if (obj.applicableStores?.length === 0) delete obj.applicableStores;
      if (obj.createdBy) obj.createdBy = obj.createdBy._id || obj.createdBy;

      return obj;
    });

    return successResponse(res, { coupons: cleanedCoupons }, 'Coupons fetched successfully by module ID');
  } catch (error) {
    console.error('Get coupons by module ID error:', error);
    return errorResponse(res, 'Error fetching coupons by module ID', 500);
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
      applicableStores,
      moduleId
    } = req.body;

    // Validate required fields
    if (!title || !code || !discount) {
      return errorResponse(res, 'Title, code and discount are required', 400);
    }

    // Validate expireDate is provided
    if (!expireDate) {
      return errorResponse(res, 'Expire date is required', 400);
    }

    // Validate date logic
    const start = startDate ? new Date(startDate) : new Date();
    const expire = new Date(expireDate);
    
    if (expire <= start) {
      return errorResponse(res, 'Expire date must be after start date', 400);
    }

    // Check duplicate code
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return errorResponse(res, 'Coupon code already exists', 400);

    // Validate moduleId if provided
    if (moduleId && !mongoose.Types.ObjectId.isValid(moduleId)) {
      return errorResponse(res, 'Invalid moduleId format', 400);
    }

    const coupon = new Coupon({
      title,
      code: code.toUpperCase(),
      type,
      discount: parseFloat(discount),
      discountType,
      totalUses: parseInt(totalUses),
      minPurchase: parseFloat(minPurchase),
      maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
      startDate: start,
      expireDate: expire,
      isActive,
      applicableCategories: Array.isArray(applicableCategories) ? applicableCategories : [],
      applicableStores: Array.isArray(applicableStores) ? applicableStores : [],
      createdBy: req.user?._id,
      moduleId: moduleId || undefined
    });

    await coupon.save();

    const populatedCoupon = await Coupon.findById(coupon._id)
      .populate('createdBy', 'firstName lastName')
      .populate('applicableCategories', 'title');
      // .populate('applicableStores', 'storeName'); // Commented out until Store model is imported

    // Clean response - remove empty arrays and unwanted fields
    const responseData = populatedCoupon.toObject();
    
    // Remove empty arrays
    if (responseData.applicableCategories?.length === 0) delete responseData.applicableCategories;
    if (responseData.applicableStores?.length === 0) delete responseData.applicableStores;
    
    // Remove createdBy details, keep only ID
    if (responseData.createdBy) {
      responseData.createdBy = responseData.createdBy._id || responseData.createdBy;
    }

    return successResponse(res, { coupon: responseData }, 'Coupon created successfully', 201);
  } catch (error) {
    console.error('Create coupon error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return errorResponse(res, `Validation error: ${messages.join(', ')}`, 400);
    }
    if (error.code === 11000) {
      return errorResponse(res, 'Coupon code already exists', 400);
    }
    return errorResponse(res, `Error creating coupon: ${error.message}`, 500);
  }
};

// ===== Update coupon =====
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return errorResponse(res, 'Coupon not found', 404);

    const updateData = { ...req.body };
    delete updateData.code; // prevent code update

    // Validate dates if being updated
    if (updateData.expireDate || updateData.startDate) {
      const start = updateData.startDate ? new Date(updateData.startDate) : coupon.startDate;
      const expire = updateData.expireDate ? new Date(updateData.expireDate) : coupon.expireDate;
      
      if (expire <= start) {
        return errorResponse(res, 'Expire date must be after start date', 400);
      }
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('createdBy', 'firstName lastName')
      .populate('applicableCategories', 'title');
      // .populate('applicableStores', 'storeName'); // Commented out until Store model is imported

    // Clean response data
    const responseData = updatedCoupon.toObject();
    
    // Remove empty arrays
    if (responseData.applicableCategories?.length === 0) delete responseData.applicableCategories;
    if (responseData.applicableStores?.length === 0) delete responseData.applicableStores;
    
    // Remove createdBy details, keep only ID
    if (responseData.createdBy) {
      responseData.createdBy = responseData.createdBy._id || responseData.createdBy;
    }

    return successResponse(res, { coupon: responseData }, 'Coupon updated successfully');
  } catch (error) {
    console.error('Update coupon error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return errorResponse(res, `Validation error: ${messages.join(', ')}`, 400);
    }
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