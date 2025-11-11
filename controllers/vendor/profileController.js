const Profile = require("../../models/vendor/Profile");
const User = require("../../models/User");
// Create a new profile
exports.createProfile = async (req, res) => {
  try {
    const { userId, name, address, mobileNumber, socialLinks } = req.body;
    const profilePhoto = req.file ? `/Uploads/profiles/${req.file.filename}` : "";

    const profile = await Profile.create({
      userId,
      name,
      address,
      mobileNumber,
      socialLinks: socialLinks ? JSON.parse(socialLinks) : {},
      profilePhoto,
    });

    res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get all profiles
exports.getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().populate("userId", "name email");
    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single profile
exports.getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id).populate("userId", "name email");
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get profile by Provider (userId)
exports.getProfileByProviderId = async (req, res) => {
  try {
    const { providerId } = req.params;
    const profile = await Profile.findOne({ userId: providerId }).populate("userId", "name email");
    if (!profile)
      return res.status(404).json({ success: false, message: "Profile not found for this provider" });

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { role, name, firstName, lastName, address, mobileNumber, socialLinks } = req.body;
    const userId = req.params.id;

    let updatedData = {};

    // Parse social links safely
    if (socialLinks) {
      try {
        updatedData.socialLinks = JSON.parse(socialLinks);
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid socialLinks format" });
      }
    }

    // Handle profile photo upload (from form-data)
    if (req.file) {
      updatedData.profilePhoto = `/Uploads/profiles/${req.file.filename}`;
    }

    // ✅ Case 1: Vendor update
    if (role === "vendor") {
      updatedData.name = name;
      updatedData.address = address;
      updatedData.mobileNumber = mobileNumber;

      const profile = await Profile.findOneAndUpdate(
        { userId },
        updatedData,
        { new: true, upsert: true }
      ).populate("userId", "email role");

      if (!profile)
        return res.status(404).json({ success: false, message: "Vendor profile not found" });

      return res.status(200).json({
        success: true,
        message: "Vendor profile updated successfully",
        data: profile,
      });
    }

    // ✅ Case 2: User update
    if (role === "user") {
      const updateFields = {
        firstName: firstName || name,
        lastName: lastName || "",
        address: address || "",
        phone: mobileNumber || "",
        socialMedia: updatedData.socialLinks || {},
      };

      // Attach profile photo if uploaded
      if (updatedData.profilePhoto) {
        updateFields.profilePhoto = updatedData.profilePhoto;
      }

      const user = await User.findByIdAndUpdate(userId, updateFields, { new: true });

      if (!user)
        return res.status(404).json({ success: false, message: "User not found" });

      return res.status(200).json({
        success: true,
        message: "User profile updated successfully",
        data: user,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid role. Please provide role as 'vendor' or 'user'.",
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete profile
exports.deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findByIdAndDelete(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    res.status(200).json({ success: true, message: "Profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
