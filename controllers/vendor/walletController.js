const Wallet = require('../../models/vendor/Wallet');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const asyncHandler = require('../../utils/asyncHandler');

/**
 * GET VENDOR WALLET (Balance + Transactions)
 */
exports.getVendorWallet = asyncHandler(async (req, res) => {
    const vendorId = req.user?._id;
    if (!vendorId) return errorResponse(res, 'Unauthorized', 401);

    let wallet = await Wallet.findOne({ vendorId })
        .populate({
            path: 'transactions.bookingId',
            select: 'moduleType bookingDate status'
        });

    if (!wallet) {
        // Initialize wallet if it doesn't exist
        wallet = await Wallet.create({ vendorId, balance: 0, transactions: [] });
    }

    // Sort transactions by date descending
    wallet.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return successResponse(res, {
        balance: wallet.balance,
        transactions: wallet.transactions
    }, 'Wallet details fetched successfully');
});

/**
 * GET WALLET SUMMARY (For Dashboard)
 */
exports.getWalletSummary = asyncHandler(async (req, res) => {
    const vendorId = req.user?._id;
    if (!vendorId) return errorResponse(res, 'Unauthorized', 401);

    const wallet = await Wallet.findOne({ vendorId });
    
    return successResponse(res, {
        balance: wallet?.balance || 0,
        recentTxCount: wallet?.transactions?.length || 0
    }, 'Wallet summary fetched');
});

/**
 * REQUEST WITHDRAWAL
 */
exports.requestWithdrawal = asyncHandler(async (req, res) => {
    const vendorId = req.user?._id;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) return errorResponse(res, 'Invalid withdrawal amount', 400);

    const wallet = await Wallet.findOne({ vendorId });
    if (!wallet) return errorResponse(res, 'Wallet not found', 404);

    if (wallet.balance < amount) {
        return errorResponse(res, 'Insufficient balance for withdrawal', 400);
    }

    // Add debit transaction
    const withdrawalTx = {
        amount,
        type: 'debit',
        description: description || 'Payout request',
        status: 'pending',
        date: new Date()
    };

    wallet.transactions.push(withdrawalTx);
    wallet.balance -= amount; // Deduct balance immediately upon request
    await wallet.save();

    return successResponse(res, {
        balance: wallet.balance,
        transaction: withdrawalTx
    }, 'Withdrawal request submitted successfully');
});
