const mongoose = require('mongoose');

// CUSTOM SLUGIFY FUNCTION (No library needed)
const slugifyURL = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           
        .replace(/[^\w\-]+/g, '')       
        .replace(/\-\-+/g, '-');        
};

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Blog title is required'],
        trim: true
    },
    slug: {
        type: String,
        unique: true
    },
    content: {
        type: String,
        required: [true, 'Blog content is required']
    },
    summary: {
        type: String,
        required: [true, 'Brief summary is required for the grid view']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Wedding', 'Planning', 'Corporate', 'Decoration', 'Photography', 'Catering']
    },
    featuredImage: {
        type: String,
        default: 'default-blog.jpg'
    },
    author: {
        type: String,
        default: 'Admin'
    },
    views: {
        type: Number,
        default: 0
    },
    tags: [String],
    isPublished: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Auto-generate slug before saving
blogSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = slugifyURL(this.title);
    }
    next();
});

module.exports = mongoose.model('Blog', blogSchema);
