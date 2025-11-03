const Profile = require("../../models/vendor/Profile");

// Create a new profile
exports.createProfile = async (req, res) => {
  try {
    const { userId, mobileNumber, socialLinks } = req.body;

    // Handle profile photo upload
    const profilePhoto = req.file ? `/Uploads/profiles/${req.file.filename}` : null;

    const profile = await Profile.create({
      userId,
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
    const { mobileNumber, socialLinks } = req.body;
    const updatedData = {
      mobileNumber,
      socialLinks: socialLinks ? JSON.parse(socialLinks) : {},
    };

    if (req.file) {
      updatedData.profilePhoto = `/Uploads/profiles/${req.file.filename}`;
    }

    const profile = await Profile.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
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
