const Package = require("../../models/admin/Package");
const SecondaryModule = require("../../models/admin/secondarymodule");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const deleteFileIfExists = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try {
            const absolutePath = filePath.startsWith("/")
                ? path.join(__dirname, "../../", filePath)
                : filePath;
            if (fs.existsSync(absolutePath)) {
                fs.unlinkSync(absolutePath);
            }
        } catch (err) {
            console.error(`Error deleting file: ${filePath}`, err);
        }
    }
};

/* =====================================================
   CREATE UNIVERSAL PACKAGE
   (Workflow same as Panthal-Decoration)
===================================================== */
exports.createSecondaryPackage = async (req, res) => {
    try {
        const {
            moduleId,
            providerId,
            title,
            description,
            price,
            advanceBookingAmount,
            includes
        } = req.body;

        if (!title || !moduleId || !providerId) {
            return res.status(400).json({ success: false, message: "Missing required fields (title, moduleId, providerId)" });
        }

        let parsedIncludes = [];
        if (includes) {
            try {
                if (typeof includes === 'string') {
                    parsedIncludes = JSON.parse(includes.replace(/'/g, '"'));
                } else {
                    parsedIncludes = Array.isArray(includes) ? includes : [includes];
                }
            } catch (e) {
                console.error("Includes parsing error:", e);
                parsedIncludes = [];
            }
        }

        const packageId = `PKG-${Date.now()}`;
        const thumbnail = req.file ? `/uploads/packages/${req.file.filename}` : null;

        const pkg = await Package.create({
            packageId,
            module: moduleId,
            provider: providerId,
            createdBy: providerId,
            title,
            description,
            price: Number(price) || 0,
            advanceAmount: Number(advanceBookingAmount) || 0, // Maps to advanceBookingAmount in UI
            thumbnail,
            images: thumbnail ? [thumbnail] : [],
            includes: parsedIncludes.map(item => (typeof item === 'string' ? { title: item, items: [] } : item))
        });

        res.status(201).json({
            success: true,
            message: "Package created successfully",
            data: pkg
        });

    } catch (err) {
        console.error("Create Package Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   GET PACKAGES BY MODULE & VENDOR
===================================================== */
exports.getPackagesByModuleVendor = async (req, res) => {
    try {
        const { moduleId, providerId } = req.params;

        const packages = await Package.find({
            module: moduleId,
            $or: [{ provider: providerId }, { createdBy: providerId }],
            isActive: true
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: packages.length,
            data: packages
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   UPDATE UNIVERSAL PACKAGE
===================================================== */
exports.updateSecondaryPackage = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        const { title, description, price, advanceBookingAmount, includes } = req.body;

        if (title) pkg.title = title;
        if (description) pkg.description = description;
        if (price) pkg.price = Number(price);
        if (advanceBookingAmount) pkg.advanceAmount = Number(advanceBookingAmount);

        if (includes) {
            try {
                let parsed = typeof includes === 'string' ? JSON.parse(includes.replace(/'/g, '"')) : includes;
                pkg.includes = parsed.map(item => (typeof item === 'string' ? { title: item, items: [] } : item));
            } catch (e) {
                console.error("Includes update error:", e);
            }
        }

        if (req.file) {
            deleteFileIfExists(pkg.thumbnail);
            pkg.thumbnail = `/uploads/packages/${req.file.filename}`;
            pkg.images = [pkg.thumbnail];
        }

        await pkg.save();

        res.json({
            success: true,
            message: "Package updated successfully",
            data: pkg
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   DELETE PACKAGE
===================================================== */
exports.deleteSecondaryPackage = async (req, res) => {
    try {
        const pkg = await Package.findById(req.params.id);
        if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

        deleteFileIfExists(pkg.thumbnail);
        await pkg.deleteOne();

        res.json({ success: true, message: "Package deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
