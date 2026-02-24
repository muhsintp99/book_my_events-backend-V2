const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");
const sendEmail = require("../../utils/sendEmail");
const { welcomeEmail } = require("../../utils/sentEmail");

// @desc    Get all pending vendor registrations
// @route   GET /api/admin/vendor-registrations/pending
// @access  Private/Admin
exports.getPendingRegistrations = async (req, res) => {
    try {
        const registrations = await VendorProfile.find({
            status: "pending",
            registrationSource: { $ne: "admin" }
        })
            .populate("user", "firstName lastName email phone userId")
            .populate("module", "title")
            .populate("zone", "name")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch pending registrations",
            error: err.message,
        });
    }
};

// @desc    Get registration detail
// @route   GET /api/admin/vendor-registrations/:id
// @access  Private/Admin
exports.getRegistrationDetail = async (req, res) => {
    try {
        const registration = await VendorProfile.findById(req.params.id)
            .populate("user", "firstName lastName email phone userId role isActive isVerified")
            .populate("module")
            .populate("zone");

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found",
            });
        }

        res.status(200).json({
            success: true,
            data: registration,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch registration details",
            error: err.message,
        });
    }
};

// @desc    Approve vendor registration
// @route   PATCH /api/admin/vendor-registrations/:id/approve
// @access  Private/Admin
exports.approveRegistration = async (req, res) => {
    try {
        const registration = await VendorProfile.findById(req.params.id).populate("user");

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found",
            });
        }

        registration.status = "approved";
        await registration.save();

        // Also ensure user is active and verified
        if (registration.user) {
            registration.user.isActive = true;
            registration.user.isVerified = true;
            await registration.user.save();

            // Send approval email
            try {
                await sendEmail(
                    registration.user.email,
                    "Congratulations! Your Vendor Account is Approved",
                    welcomeEmail(registration.user)
                );
            } catch (emailErr) {
                console.error("Failed to send approval email:", emailErr.message);
            }
        }

        res.status(200).json({
            success: true,
            message: "Vendor registration approved successfully",
            data: registration,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to approve registration",
            error: err.message,
        });
    }
};

// @desc    Reject vendor registration
// @route   PATCH /api/admin/vendor-registrations/:id/reject
// @access  Private/Admin
exports.rejectRegistration = async (req, res) => {
    try {
        const { reason } = req.body;
        const registration = await VendorProfile.findById(req.params.id).populate("user");

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: "Registration not found",
            });
        }

        registration.status = "rejected";
        // We could store the rejection reason if we added a field to the model
        await registration.save();

        res.status(200).json({
            success: true,
            message: "Vendor registration rejected",
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Failed to reject registration",
            error: err.message,
        });
    }
};
