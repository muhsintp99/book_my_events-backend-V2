const mongoose = require('mongoose');

const PincodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        trim: true
    },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: 'India' },

    // Zone ID is essential for "Entire Zone" delivery mode matching
    zone_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Zone'
    },

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
PincodeSchema.index({ code: 1, city: 1 }, { unique: true });
PincodeSchema.index({ code: 1 });
PincodeSchema.index({ zone_id: 1 });

module.exports = mongoose.model('Pincode', PincodeSchema);
