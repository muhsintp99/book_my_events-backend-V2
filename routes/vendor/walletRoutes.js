const express = require('express');
const router = express.Router();
const walletController = require('../../controllers/vendor/walletController');
const { protect } = require('../../middlewares/authMiddleware');

/**
 * @route   GET /api/vendor/wallet
 * @desc    Get vendor wallet balance and transactions
 * @access  Private (Vendor)
 */
router.get('/', protect, walletController.getVendorWallet);

/**
 * @route   GET /api/vendor/wallet/summary
 * @desc    Get vendor wallet summary
 * @access  Private (Vendor)
 */
router.get('/summary', protect, walletController.getWalletSummary);

/**
 * @route   POST /api/vendor/wallet/withdrawal-request
 * @desc    Submit withdrawal request (payout)
 * @access  Private (Vendor)
 */
router.post('/withdrawal-request', protect, walletController.requestWithdrawal);

module.exports = router;
