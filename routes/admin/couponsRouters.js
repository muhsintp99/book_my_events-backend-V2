const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/admin/couponController');
const { protect, authorizeRoles } = require('../../middlewares/authMiddleware');

// Only admin/superadmin can access
router.use(protect);
router.use(authorizeRoles('superadmin', 'admin'));

// CRUD routes
router.get('/', couponController.getAllCoupons);
router.get('/:id', couponController.getCouponById);
router.post('/', couponController.createCoupon);
router.put('/:id', couponController.updateCoupon);
router.delete('/:id', couponController.deleteCoupon);

// Toggle status
router.patch('/:id/toggle', couponController.toggleCouponStatus);

// Validate & apply
router.post('/validate', couponController.validateCoupon);
router.post('/apply', couponController.applyCoupon);

module.exports = router;
