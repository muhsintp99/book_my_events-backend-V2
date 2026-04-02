const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/admin/couponController');
const { protect, authorizeRoles } = require('../../middlewares/authMiddleware');

// Public routes (for customer booking flow)
router.post('/validate', couponController.validateCoupon);
router.post('/apply', couponController.applyCoupon);
router.get('/coupon/:code', couponController.getDiscountByCode); 

// These routes used to be protected but are needed for the frontend display
router.get('/', couponController.getAllCoupons);
router.get('/module/:moduleId', couponController.getCouponsByModuleId);

// Protected administrative routes (for Admin/Vendor panel)
// These routes require authentication and specific roles
router.use(protect);
router.use(authorizeRoles('superadmin', 'admin', 'vendor'));

// CRUD routes
router.get('/:id', couponController.getCouponById);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);

// Toggle status
router.patch('/:id/toggle', couponController.toggleCouponStatus);

module.exports = router;
