const fs = require('fs');
const path = require('path');
const Blog = require('../../models/admin/blogModel');

// Helper: delete file if exists (Following your moduleController style)
const deleteFileIfExists = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// @desc    Get all blogs with pagination (Public View)
exports.getBlogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        const filter = { isPublished: true };
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.tag) {
            filter.tags = { $in: [req.query.tag] };
        }

        const blogs = await Blog.find(filter)
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit);

        const total = await Blog.countDocuments(filter);

        res.status(200).json({
            success: true,
            pagination: { total, page, pages: Math.ceil(total / limit) },
            data: blogs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Get all blogs for Admin (shows unpublished)
exports.getBlogsForAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const blogs = await Blog.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Blog.countDocuments();

        res.status(200).json({
            success: true,
            pagination: { total, page, pages: Math.ceil(total / limit) },
            data: blogs
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Get single blog by ID (For Admin Edit)
exports.getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });
        res.status(200).json({ success: true, data: blog });
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

// CUSTOM SLUGIFY (Also used in model, but here for manual update triggers)
const slugify = (text) => {
    return text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
};

// @desc    Create new blog
exports.createBlog = async (req, res) => {
    try {
        const blogData = {
            ...req.body,
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

        // Manual slug update because findByIdAndUpdate bypasses pre-save hook
        if (req.body.title) {
            updateData.slug = slugify(req.body.title);
        }

        if (req.file) {
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

        if (blog.featuredImage && blog.featuredImage !== 'default-blog.jpg') {
            deleteFileIfExists(path.join(__dirname, `../../${blog.featuredImage}`));
        }

        await blog.deleteOne();
        res.json({ success: true, message: 'Blog deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
