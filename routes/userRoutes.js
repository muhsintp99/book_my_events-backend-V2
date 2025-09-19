const express = require('express');
const router = express.Router();
const {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  validateCoupon,
  applyCoupon
} = require('../controllers/admin/couponController');

const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Routes protected and restricted to 'superadmin' and 'admin'
router.get('/', protect, authorizeRoles('superadmin', 'admin'), getAllCoupons);
router.get('/:id', protect, authorizeRoles('superadmin', 'admin'), getCouponById);
router.post('/', protect, authorizeRoles('superadmin', 'admin'), createCoupon);
router.put('/:id', protect, authorizeRoles('superadmin', 'admin'), updateCoupon);
router.delete('/:id', protect, authorizeRoles('superadmin', 'admin'), deleteCoupon);
router.patch('/:id/toggle', protect, authorizeRoles('superadmin', 'admin'), toggleCouponStatus);

// Public routes (no protection)
router.post('/validate', validateCoupon);
router.post('/apply', applyCoupon);

module.exports = router;
