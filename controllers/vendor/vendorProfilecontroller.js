const VendorProfile = require("../../models/vendor/vendorProfile");
const mongoose = require("mongoose");

const populateFields = [
    {
        path: "module",
        select: "moduleId title icon categories isActive createdAt updatedAt",
        populate: {
            path: "categories",
            select: "title description isActive createdAt updatedAt",
        },
    },
    {
        path: "zones",
        select: "name description coordinates city country isActive",
    },
    { path: "reviewedBy", select: "userId firstName lastName email role" },
    { path: "user", select: "userId firstName lastName email phone role isActive" },
    { path: "approvedProvider", select: "name contact email phone" },
];

// ➤ Create Vendor Profile
exports.createVendorProfile = async (req, res) => {
    try {
        const vendor = await VendorProfile.create(req.body);
        const populatedVendor = await VendorProfile.findById(vendor._id).populate(populateFields);
        res.status(201).json({ success: true, data: populatedVendor });
    } catch (error) {
        console.error("Error creating vendor:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const { getCache, setCache } = require("../../utils/cache");

// ➤ Get All Vendors
exports.getVendors = async (req, res) => {
    try {
        const { page = 1, limit = 20, module, zone } = req.query;
        
        const cacheKey = `vendors_${JSON.stringify(req.query)}`;
        const cachedData = getCache(cacheKey);
        if (cachedData) return res.status(200).json(cachedData);

        const filter = { status: "approved", isActive: true };
        if (module) filter.module = module;
        if (zone) filter.zones = zone;

        const vendors = await VendorProfile.find(filter)
            .populate(populateFields)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean(); // Faster performance

        const total = await VendorProfile.countDocuments(filter);
        
        const responseData = { 
            success: true, 
            data: vendors,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        };

        // Cache for 2 minutes
        setCache(cacheKey, responseData, 2);

        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error fetching vendors:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// ➤ Get Single Vendor (by vendor profile _id)
exports.getVendor = async (req, res) => {
    try {
        const vendor = await VendorProfile.findById(req.params.id).populate(populateFields);
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        res.status(200).json({ success: true, data: vendor });
    } catch (error) {
        console.error("Error fetching vendor:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ➤ Find Vendor Profile (tries by user ID first, then by profile ID)
exports.findVendorProfile = async (req, res) => {
    try {
        const id = req.params.id;
        const moduleId = req.query.moduleId || req.query.moduleid;

        // 1. Try finding by the 'user' field reference
        let query = { user: id };
        if (moduleId && mongoose.Types.ObjectId.isValid(moduleId)) {
            query.module = moduleId;
        }
        
        let vendor = await VendorProfile.findOne(query).populate(populateFields);

        // 2. Fallback: Try finding by the vendor profile's own _id
        if (!vendor) {
            vendor = await VendorProfile.findById(id).populate(populateFields);
        }

        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor profile not found" });
        }

        res.status(200).json({ success: true, data: vendor });
    } catch (error) {
        console.error("Error finding vendor profile:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ➤ Update Vendor Profile
exports.updateVendorProfile = async (req, res) => {
    try {
        const vendor = await VendorProfile.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        }).populate(populateFields);

        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        res.status(200).json({ success: true, data: vendor });
    } catch (error) {
        console.error("Error updating vendor:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ➤ Delete Vendor Profile
exports.deleteVendorProfile = async (req, res) => {
    try {
        const vendor = await VendorProfile.findByIdAndDelete(req.params.id);
        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        res.status(200).json({ success: true, message: "Vendor profile deleted" });
    } catch (error) {
        console.error("Error deleting vendor:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ➤ Approve Vendor
exports.approveVendor = async (req, res) => {
    try {
        const vendor = await VendorProfile.findByIdAndUpdate(
            req.params.id,
            { status: "approved", reviewedBy: req.user?._id, reviewedAt: new Date() },
            { new: true }
        ).populate(populateFields);

        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        res.status(200).json({ success: true, data: vendor });
    } catch (error) {
        console.error("Error approving vendor:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ➤ Reject Vendor
exports.rejectVendor = async (req, res) => {
    try {
        const vendor = await VendorProfile.findByIdAndUpdate(
            req.params.id,
            {
                status: "rejected",
                rejectionReason: req.body.rejectionReason,
                reviewedBy: req.user?._id,
                reviewedAt: new Date(),
            },
            { new: true }
        ).populate(populateFields);

        if (!vendor) {
            return res.status(404).json({ success: false, message: "Vendor not found" });
        }
        res.status(200).json({ success: true, data: vendor });
    } catch (error) {
        console.error("Error rejecting vendor:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
