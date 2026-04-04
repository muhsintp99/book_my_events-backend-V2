const Wallet = require('../../models/vendor/Wallet');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const asyncHandler = require('../../utils/asyncHandler');
const mongoose = require('mongoose');

/**
 * LIST ALL PENDING WITHDRAWALS (For Admin)
 */
exports.getAllPendingWithdrawals = asyncHandler(async (req, res) => {
    // Aggregation to flatten all transactions from all wallets and filter pending ones
    const pendingWithdrawals = await Wallet.aggregate([
        { $unwind: '$transactions' },
        { 
            $match: { 
                'transactions.type': 'debit', 
                'transactions.status': 'pending' 
            } 
        },
        {
            $lookup: {
                from: 'users',
                localField: 'vendorId',
                foreignField: '_id',
                as: 'vendor'
            }
        },
        { $unwind: '$vendor' },
        {
            $project: {
                _id: 1,
                userId: '$vendor._id',
                vendorName: { $concat: ['$vendor.firstName', ' ', '$vendor.lastName'] },
                email: '$vendor.email',
                phone: '$vendor.phone',
                transaction: '$transactions',
                currentBalance: '$balance'
            }
        },
        { $sort: { 'transaction.date': -1 } }
    ]);

    return successResponse(res, pendingWithdrawals, 'Pending withdrawals fetched successfully');
});

/**
 * APPROVE OR REJECT WITHDRAWAL
 */
exports.processWithdrawal = asyncHandler(async (req, res) => {
    const { walletId, transactionId, action } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
        return errorResponse(res, 'Invalid action. Must be approve or reject', 400);
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return errorResponse(res, 'Wallet not found', 404);

    const tx = wallet.transactions.id(transactionId);
    if (!tx) return errorResponse(res, 'Transaction not found', 404);

    if (tx.status !== 'pending') {
        return errorResponse(res, 'Transaction is not in pending status', 400);
    }

    if (tx.type !== 'debit') {
        return errorResponse(res, 'Only withdrawal (debit) transactions can be processed via this endpoint', 400);
    }

    if (action === 'approve') {
        tx.status = 'completed';
        // Balance was already deducted upon vendor request
    } else {
        tx.status = 'failed';
        tx.description += ' (Rejected by Admin)';
        // Revert balance if rejected
        wallet.balance += tx.amount;
    }

    await wallet.save();

    return successResponse(res, {
        txId: tx._id,
        newStatus: tx.status,
        actionTaken: action
    }, `Withdrawal request ${action}ed successfully`);
});
