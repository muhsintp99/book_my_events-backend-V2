const fs = require('fs');
const path = require('path');
const Blog = require('../../models/admin/blogModel');

// Helper: delete file if exists (Following your moduleController style)
const deleteFileIfExists = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// @desc    Get all blogs with pagination
exports.getBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        const blogs = await Blog.find({ isPublished: true })
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit);

        const total = await Blog.countDocuments({ isPublished: true });

        res.status(200).json({
            success: true,
            pagination: { total, page, pages: Math.ceil(total / limit) },
            data: blogs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
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

        if (!blog) return res.status(404).json({ error: 'Blog not found' });
        res.status(200).json({ success: true, data: blog });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Create new blog
exports.createBlog = async (req, res) => {
    try {
        const blogData = {
            ...req.body,
            // Store relative path like your modules
            featuredImage: req.file ? `Uploads/blogs/${req.file.filename}` : 'default-blog.jpg'
        };

        const blog = await Blog.create(blogData);
        res.status(201).json({ success: true, data: blog });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// @desc    Update blog
exports.updateBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });

        const updateData = { ...req.body };

        if (req.file) {
            // Delete old image using your logic
            if (blog.featuredImage && blog.featuredImage !== 'default-blog.jpg') {
                deleteFileIfExists(path.join(__dirname, `../../${blog.featuredImage}`));
            }
            updateData.featuredImage = `Uploads/blogs/${req.file.filename}`;
        }

        const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: updatedBlog });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// @desc    Delete blog
exports.deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });

        // Delete image using your logic
        if (blog.featuredImage && blog.featuredImage !== 'default-blog.jpg') {
            deleteFileIfExists(path.join(__dirname, `../../${blog.featuredImage}`));
        }

        await blog.deleteOne();
        res.json({ success: true, message: 'Blog deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
