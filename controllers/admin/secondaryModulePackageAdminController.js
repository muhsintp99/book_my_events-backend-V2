const Package = require("../../models/admin/Package");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const Enquiry = require("../../models/vendor/Enquiry");
const Category = require("../../models/admin/category");
const Booking = require("../../models/vendor/Booking");
const mongoose = require("mongoose");

/* =====================================================
   1. MODULE DASHBOARD (Module-Specific Stats)
===================================================== */
exports.getModuleDashboard = async (req, res) => {
    try {
        const { moduleId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ success: false, message: "Invalid Module ID" });
        }

        const totalPackages = await Package.countDocuments({ module: moduleId });
        const totalVendors = await VendorProfile.countDocuments({ module: moduleId });
        const totalEnquiries = await Enquiry.countDocuments({ moduleId: moduleId });
        
        // Earnings for this module
        const earnings = await Booking.aggregate([
            { $match: { moduleId: new mongoose.Types.ObjectId(moduleId), status: "Accepted" } },
            { $group: { _id: null, total: { $sum: "$finalPrice" } } }
        ]);

        res.json({
            success: true,
            data: {
                totalPackages,
                totalVendors,
                totalEnquiries,
                totalEarnings: earnings[0]?.total || 0
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   2. PROVIDER LIST (Filtered by Module)
===================================================== */
exports.getModuleProviders = async (req, res) => {
    try {
        const { moduleId } = req.params;

        const providers = await VendorProfile.find({ module: moduleId })
            .populate("user", "firstName lastName email phone isActive")
            .populate("zones", "name")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: providers.length,
            data: providers
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   3. ADD PROVIDER TO MODULE (Manually)
===================================================== */
exports.addProviderToModule = async (req, res) => {
    try {
        const { userId, moduleId, storeName, zones } = req.body;

        if (!userId || !moduleId) {
            return res.status(400).json({ success: false, message: "User ID and Module ID are required" });
        }

        let profile = await VendorProfile.findOne({ user: userId, module: moduleId });
        
        if (profile) {
            return res.status(400).json({ success: false, message: "Provider already assigned to this module" });
        }

        profile = await VendorProfile.create({
            user: userId,
            module: moduleId,
            storeName,
            zones,
            status: "approved",
            isActive: true,
            registrationSource: "admin"
        });

        // Ensure user role is updated to vendor
        await User.findByIdAndUpdate(userId, { role: "vendor" });

        res.status(201).json({
            success: true,
            message: "Provider assigned to module successfully",
            data: profile
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   4. MODULE ENQUIRIES
===================================================== */
exports.getModuleEnquiries = async (req, res) => {
    try {
        const { moduleId } = req.params;

        const enquiries = await Enquiry.find({ moduleId: moduleId })
            .populate("vendorId", "firstName lastName email")
            .populate("userId", "firstName lastName email")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: enquiries.length,
            data: enquiries
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/* =====================================================
   5. MODULE CATEGORIES
===================================================== */
exports.getModuleCategories = async (req, res) => {
    try {
        const { moduleId } = req.params;

        const categories = await Category.find({ module: moduleId })
            .populate("parentCategory", "title")
            .sort({ title: 1 });

        res.json({
            success: true,
            count: categories.length,
            data: categories
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
