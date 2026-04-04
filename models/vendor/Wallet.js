const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: false
    },
    amount: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        default: 'credit'
    },
    description: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const walletSchema = new mongoose.Schema({
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the vendor's user account
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactions: [transactionSchema]
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
