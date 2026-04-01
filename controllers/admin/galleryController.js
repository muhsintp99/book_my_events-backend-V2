const fs = require('fs');
const path = require('path');
const Gallery = require('../../models/admin/galleryModel');

const deleteFileIfExists = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

// @desc    Get all gallery items
exports.getGallery = async (req, res) => {
    try {
        const filter = {};
        if (req.query.module) {
            filter.module = req.query.module;
        }

        const gallery = await Gallery.find(filter)
            .populate('module') // Assuming it can be populated if ref is correct
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: gallery });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// @desc    Create new gallery item
exports.createGallery = async (req, res) => {
    try {
        const { title, module, isFeatured, moduleModel } = req.body;
        const galleryData = {
            title,
            module,
            moduleModel: moduleModel || 'Module',
            isFeatured: isFeatured === 'true' || isFeatured === true,
            image: req.file ? `Uploads/gallery/${req.file.filename}` : ''
        };

        if (!galleryData.image) {
            return res.status(400).json({ error: 'Image is required' });
        }

        const galleryItem = await Gallery.create(galleryData);
        res.status(201).json({ success: true, data: galleryItem });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// @desc    Update gallery item
exports.updateGallery = async (req, res) => {
    try {
        const galleryItem = await Gallery.findById(req.params.id);
        if (!galleryItem) return res.status(404).json({ error: 'Gallery item not found' });

        const { title, module, isFeatured, moduleModel } = req.body;
        const updateData = {
            title,
            module,
            moduleModel: moduleModel || 'Module',
            isFeatured: isFeatured === 'true' || isFeatured === true,
        };

        if (req.file) {
            // Delete old image
            if (galleryItem.image) {
                deleteFileIfExists(path.join(__dirname, `../../${galleryItem.image}`));
            }
            updateData.image = `Uploads/gallery/${req.file.filename}`;
        }

        const updatedItem = await Gallery.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: updatedItem });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// @desc    Delete gallery item
exports.deleteGallery = async (req, res) => {
    try {
        const galleryItem = await Gallery.findById(req.params.id);
        if (!galleryItem) return res.status(404).json({ error: 'Gallery item not found' });

        if (galleryItem.image) {
            deleteFileIfExists(path.join(__dirname, `../../${galleryItem.image}`));
        }

        await galleryItem.deleteOne();
        res.json({ success: true, message: 'Gallery item deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
