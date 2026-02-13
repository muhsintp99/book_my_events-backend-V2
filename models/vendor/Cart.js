const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
            unique: true // One cart per user
        },
        items: [
            {
                cakeId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Cake',
                    required: true
                },
                name: {
                    type: String,
                    required: true
                },
                image: {
                    type: String,
                    default: ''
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1
                },
                message: {
                    type: String,
                    default: 'N/A'
                },
                variations: [
                    {
                        variationId: mongoose.Schema.Types.ObjectId,
                        name: String,
                        price: Number
                    }
                ],
                addons: [
                    {
                        title: String,
                        price: Number,
                        icon: String
                    }
                ],
                itemPrice: {
                    type: Number,
                    required: true,
                    default: 0
                },
                totalPrice: {
                    type: Number,
                    required: true,
                    default: 0
                }
            }
        ],
        totalItems: {
            type: Number,
            default: 0
        },
        subtotal: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

// Calculate totals before saving
cartSchema.pre('save', function (next) {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    next();
});

// Index for faster queries
cartSchema.index({ userId: 1 });

module.exports = mongoose.model('Cart', cartSchema);
