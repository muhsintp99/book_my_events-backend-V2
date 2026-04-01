const Blog = require('../../models/admin/blogModel');

// @desc    Get all blogs with pagination (Newest First)
exports.getBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        const blogs = await Blog.find({ isPublished: true })
            .sort({ createdAt: -1 }) // Newest blogs at the top
            .skip(skip)
            .limit(limit);

        const total = await Blog.countDocuments({ isPublished: true });

        res.status(200).json({
            success: true,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            },
            data: blogs
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get single blog by slug
exports.getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOneAndUpdate(
            { slug: req.params.slug },
            { $inc: { views: 1 } }, 
            { new: true }
        );

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        res.status(200).json({ success: true, data: blog });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create new blog with Image
exports.createBlog = async (req, res) => {
    try {
        const blogData = { ...req.body };

        // 🖼️ Handle uploaded image
        if (req.file) {
            blogData.featuredImage = req.file.filename;
        }

        const blog = await Blog.create(blogData);
        res.status(201).json({ success: true, data: blog });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update blog with Image
exports.updateBlog = async (req, res) => {
    try {
        const blogData = { ...req.body };

        // 🖼️ Handle new image update
        if (req.file) {
            blogData.featuredImage = req.file.filename;
        }

        const blog = await Blog.findByIdAndUpdate(req.params.id, blogData, {
            new: true,
            runValidators: true
        });

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }
        
        res.status(200).json({ success: true, data: blog });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete blog
exports.deleteBlog = async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Blog deleted' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
