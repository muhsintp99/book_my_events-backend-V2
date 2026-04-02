const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/blogController');
const createUpload = require("../../middlewares/upload");

// 🖼️ Initialize upload for "blogs" folder
const upload = createUpload("blogs", {
    fileSizeMB: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/jpg"]
});

// PUBLIC ROUTES
router.get('/', controller.getBlogs);
router.get('/slug/:slug', controller.getBlogBySlug);

// ADMIN ROUTES
router.get('/admin', controller.getBlogsForAdmin);
router.get('/:id', controller.getBlogById);
router.post('/create', upload.single("image"), controller.createBlog);
router.put('/:id', upload.single("image"), controller.updateBlog);
router.delete('/:id', controller.deleteBlog);

module.exports = router;
