const express = require('express');
const router = express.Router();
const walletAdminController = require('../../controllers/admin/walletAdminController');
// Note: Assuming 'protect' middleware is defined. Some projects use different auth middleware for admin.
const { protect } = require('../../middlewares/authMiddleware');

/**
 * @route   GET /api/admin/wallet/all-withdrawals
 * @desc    Get all vendor withdrawal requests (All statuses)
 * @access  Private (Admin)
 */
router.get('/all-withdrawals', protect, walletAdminController.getAllWithdrawals);

/**
 * @route   GET /api/admin/wallet/pending-withdrawals
 * @desc    Get all pending vendor withdrawal requests
 * @access  Private (Admin)
 */
router.get('/pending-withdrawals', protect, walletAdminController.getAllPendingWithdrawals);

/**
 * @route   POST /api/admin/wallet/process-withdrawal
 * @desc    Approve or reject a withdrawal request
 * @access  Private (Admin)
 */
router.post('/process-withdrawal', protect, walletAdminController.processWithdrawal);

module.exports = router;
