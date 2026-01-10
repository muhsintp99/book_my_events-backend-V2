const Profile = require("../../models/vendor/Profile");

/**
 * ======================================
 * GET ALL KYC REQUESTS (ADMIN)
 * ======================================
 * Fetches all profiles where KYC has been submitted (pending, verified, or rejected)
 */
exports.getAllKycRequests = async (req, res) => {
    try {
        const requests = await Profile.find({
            "kycDetails.status": { $ne: "not_submitted" }
        })
            .populate("userId", "firstName lastName email phone role")
            .sort({ "kycDetails.submittedAt": -1 });

        res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error("Get all KYC requests error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ======================================
 * UPDATE KYC STATUS (ADMIN)
 * ======================================
 * Approves or rejects a vendor's KYC submission
 */
exports.updateKycStatus = async (req, res) => {
    try {
        const { userId, status, rejectionReason } = req.body;

        if (!userId || !status) {
            return res.status(400).json({
                success: false,
                message: "User ID and status are required"
            });
        }

        if (!['verified', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Must be 'verified', 'rejected', or 'pending'"
            });
        }

        const updateData = {
            "kycDetails.status": status
        };

        if (status === 'rejected') {
            updateData["kycDetails.rejectionReason"] = rejectionReason || "Documents not clear or invalid";
        } else if (status === 'verified') {
            updateData["kycDetails.rejectionReason"] = ""; // Clear reason on verification
        }

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true }
        ).populate("userId", "firstName lastName email phone role");

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found for this user"
            });
        }

        res.status(200).json({
            success: true,
            message: `KYC status updated to ${status}`,
            data: profile.kycDetails
        });
    } catch (error) {
        console.error("Update KYC status error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
