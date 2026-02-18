const mongoose = require('mongoose');

const PincodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
}, { timestamps: true });

// 2dsphere index for geospatial queries
PincodeSchema.index({ location: '2dsphere' });
PincodeSchema.index({ code: 1 });

module.exports = mongoose.model('Pincode', PincodeSchema);
