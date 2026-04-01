const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Gallery item title is required'],
        trim: true
    },
    image: {
        type: String,
        required: [true, 'Image is required']
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        refPath: 'moduleModel',
        index: true
    },
    moduleModel: {
        type: String,
        required: false,
        enum: ['Module', 'SecondaryModule'],
        default: 'Module'
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
