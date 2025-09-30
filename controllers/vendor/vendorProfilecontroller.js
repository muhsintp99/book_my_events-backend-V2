const VendorProfile = require("../../models/vendor/vendorProfile");

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
        path: "zone",
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

// ➤ Get All Vendors
exports.getVendors = async (req, res) => {
    try {
        const vendors = await VendorProfile.find().populate(populateFields);
        res.status(200).json({ success: true, data: vendors });
    } catch (error) {
        console.error("Error fetching vendors:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ➤ Get Single Vendor
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
