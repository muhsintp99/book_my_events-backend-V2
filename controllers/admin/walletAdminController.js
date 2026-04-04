const Wallet = require('../../models/vendor/Wallet');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const asyncHandler = require('../../utils/asyncHandler');
const mongoose = require('mongoose');
const sendEmail = require('../../utils/sendEmail');
const { sendWhatsAppMessage } = require('../../utils/whatsapp');

/**
 * LIST ALL WITHDRAWAL REQUESTS (Supports Filtering by Status)
 */
exports.getAllWithdrawals = asyncHandler(async (req, res) => {
    const { status } = req.query;

    const matchCondition = { 'transactions.type': 'debit' };
    if (status && status !== 'all') {
        matchCondition['transactions.status'] = status;
    }

    // Aggregation to flatten all transactions from all wallets and filter debit ones
    const withdrawals = await Wallet.aggregate([
        { $unwind: '$transactions' },
        { 
            $match: matchCondition 
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

    return successResponse(res, withdrawals, 'Withdrawals fetched successfully');
});

/**
 * LIST ALL PENDING WITHDRAWALS (For Admin)
 */
exports.getAllPendingWithdrawals = asyncHandler(async (req, res) => {
    // Re-use aggregation but match pending
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

    const wallet = await Wallet.findById(walletId).populate('vendorId');
    if (!wallet) return errorResponse(res, 'Wallet not found', 404);

    const tx = wallet.transactions.id(transactionId);
    if (!tx) return errorResponse(res, 'Transaction not found', 404);

    if (tx.status !== 'pending') {
        return errorResponse(res, 'Transaction is not in pending status', 400);
    }

    if (tx.type !== 'debit') {
        return errorResponse(res, 'Only withdrawal (debit) transactions can be processed via this endpoint', 400);
    }

    const vendor = wallet.vendorId;
    const amount = tx.amount;
    let statusMessage = '';

    if (action === 'approve') {
        tx.status = 'completed';
        statusMessage = `Your withdrawal request of ₹${amount} has been APPROVED and processed successfully.`;
        // Balance was already deducted upon vendor request
    } else {
        tx.status = 'failed';
        tx.description += ' (Rejected by Admin)';
        statusMessage = `Your withdrawal request of ₹${amount} has been REJECTED by the administrator. The amount has been credited back to your wallet.`;
        // Revert balance if rejected
        wallet.balance += tx.amount;
    }

    await wallet.save();

    // 📩 SEND NOTIFICATIONS (WhatsApp & Email)
    if (vendor && (vendor.phone || vendor.mobile || vendor.email)) {
        const vendorName = `${vendor.firstName || 'Vendor'} ${vendor.lastName || ''}`.trim();
        const whatsappMsg = `Hello ${vendorName},\n\n${statusMessage}\n\nTransaction ID: ${tx._id}\n\nThank you,\nBook My Event Team`;

        // Send Email
        if (vendor.email) {
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
                    <h2 style="color: ${action === 'approve' ? '#28a745' : '#dc3545'};">Withdrawal Request Update</h2>
                    <p>Hello <strong>${vendorName}</strong>,</p>
                    <p>${statusMessage}</p>
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr style="background: #f8f9fa;">
                            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Amount</strong></td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">₹${amount}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Transaction ID</strong></td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">${tx._id}</td>
                        </tr>
                        <tr style="background: #f8f9fa;">
                            <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Status</strong></td>
                            <td style="padding: 10px; border: 1px solid #dee2e6;">${tx.status.toUpperCase()}</td>
                        </tr>
                    </table>
                    <p style="margin-top: 30px;">Best Regards,<br/><strong>Evenza Infotech (Book My Event Team)</strong></p>
                </div>
            `;
            sendEmail(vendor.email, `Book My Event: Withdrawal Request ${action.toUpperCase()}D`, emailHtml)
                .catch(err => console.error('Delayed Email Error:', err));
        }

        // Send WhatsApp
        const recipientPhone = vendor.phone || vendor.mobile;
        if (recipientPhone) {
            sendWhatsAppMessage(recipientPhone, whatsappMsg)
                .catch(err => console.error('Delayed WhatsApp Error:', err));
        }
    }

    return successResponse(res, {
        txId: tx._id,
        newStatus: tx.status,
        actionTaken: action
    }, `Withdrawal request ${action}ed successfully`);
});
