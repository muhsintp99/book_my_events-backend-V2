const Profile = require("../../models/vendor/Profile");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");

// Create a new profile

exports.getAllVendors = async (req, res) => {
  try {
    const vendors = await VendorProfile.find()
      .populate({
        path: "user",
        select: "firstName lastName email phone role"
      })
      .populate({
        path: "module",
        select: "title moduleId icon"
      })
      .populate({
        path: "zone",
        select: "name city country"
      });

    return res.status(200).json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    console.error("Get all vendors error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



exports.getSingleVendor = async (req, res) => {
  try {
    const { providerId } = req.params;

    const vendor = await VendorProfile.findOne({ user: providerId })
      .populate("user", "firstName lastName email phone role profilePhoto")
      .populate("module", "title moduleId icon")
      .populate("zone", "name city country");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vendor,
    });

  } catch (error) {
    console.error("Get single vendor error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// exports.createProfile = async (req, res) => {
//   try {
//     const { userId, name, address, mobileNumber, socialLinks } = req.body;
//     const profilePhoto = req.file ? `/uploads/profiles/${req.file.filename}` : "";

//     const profile = await Profile.create({
//       userId,
//       name,
//       address,
//       mobileNumber,
//       socialLinks: socialLinks ? JSON.parse(socialLinks) : {},
//       profilePhoto,
//     });

//     res.status(201).json({
//       success: true,
//       message: "Profile created successfully",
//       data: profile,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };



exports.createProfile = async (req, res) => {
  try {
    // UPDATED: Accept vendorName and businessAddress
    const { userId, vendorName, businessAddress, mobileNumber, socialLinks } = req.body;
    const profilePhoto = req.file ? `/uploads/profiles/${req.file.filename}` : "";
    const profile = await Profile.create({
      userId,
      vendorName,      // Changed from name
      businessAddress, // Changed from address
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

// Get Profile by Provider ID (userId) with Auto-Create
exports.getProfileByProviderId = async (req, res) => {
  try {
    const { providerId } = req.params;

    // 1. Try to find existing profile
    let profile = await Profile.findOne({ userId: providerId });

    if (profile) {
      return res.status(200).json({ success: true, data: profile });
    }

    // 2. If no profile exists, checking if User exists to Auto-Create
    const user = await User.findById(providerId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 3. Check for VendorProfile to get better defaults
    const vendorProfile = await VendorProfile.findOne({ user: providerId });

    // 4. Prepare default data
    let vendorName = `${user.firstName} ${user.lastName}`;
    let mobileNumber = user.phone || "";
    let businessAddress = "";

    if (vendorProfile) {
      // User preference: Use Owner Name instead of Store Name
      vendorName = `${vendorProfile.ownerFirstName} ${vendorProfile.ownerLastName}`;
      mobileNumber = vendorProfile.ownerPhone || mobileNumber;
      if (vendorProfile.storeAddress && vendorProfile.storeAddress.fullAddress) {
        businessAddress = vendorProfile.storeAddress.fullAddress;
      }
    }

    // 5. Create new Profile
    profile = new Profile({
      userId: providerId,
      vendorName: vendorName.trim(), // Ensure no extra spaces
      mobileNumber: mobileNumber,
      businessAddress: businessAddress,
      email: user.email,
      socialLinks: {}
    });

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profile created successfully",
      data: profile
    });

  } catch (error) {
    console.error("Error fetching/creating profile:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Update profile
// exports.updateProfile = async (req, res) => {
//   try {
//     const { role, name, firstName, lastName, address, mobileNumber, socialLinks } = req.body;
//     const userId = req.params.id;

//     let updatedData = {};

//     // Parse social links safely
//     if (socialLinks) {
//       try {
//         updatedData.socialLinks = JSON.parse(socialLinks);
//       } catch (err) {
//         return res.status(400).json({ success: false, message: "Invalid socialLinks format" });
//       }
//     }

//     // Handle profile photo upload (from form-data)
//     if (req.file) {
//       updatedData.profilePhoto = `/uploads/profiles/${req.file.filename}`;
//     }

//     // ✅ Case 1: Vendor update
//     if (role === "vendor") {
//       updatedData.name = name;
//       updatedData.address = address;
//       updatedData.mobileNumber = mobileNumber;

//       const profile = await Profile.findOneAndUpdate(
//         { userId },
//         updatedData,
//         { new: true, upsert: true }
//       ).populate("userId", "email role");

//       if (!profile)
//         return res.status(404).json({ success: false, message: "Vendor profile not found" });

//       return res.status(200).json({
//         success: true,
//         message: "Vendor profile updated successfully",
//         data: profile,
//       });
//     }

//     // ✅ Case 2: User update
//     if (role === "user") {
//       const updateFields = {
//         firstName: firstName || name,
//         lastName: lastName || "",
//         address: address || "",
//         phone: mobileNumber || "",
//         socialMedia: updatedData.socialLinks || {},
//       };

//       // Attach profile photo if uploaded
//       if (updatedData.profilePhoto) {
//         updateFields.profilePhoto = updatedData.profilePhoto;
//       }

//       const user = await User.findByIdAndUpdate(userId, updateFields, { new: true });

//       if (!user)
//         return res.status(404).json({ success: false, message: "User not found" });

//       return res.status(200).json({
//         success: true,
//         message: "User profile updated successfully",
//         data: user,
//       });
//     }

//     return res.status(400).json({
//       success: false,
//       message: "Invalid role. Please provide role as 'vendor' or 'user'.",
//     });
//   } catch (error) {
//     console.error("Update Profile Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };






// ... existing imports

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    // 1. Accept ONLY the fields sent by Frontend
    const { role, vendorName, firstName, lastName, businessAddress, mobileNumber, socialLinks } = req.body;

    // 2. The ID in the URL is the PROFILE ID (based on your frontend call)
    const id = req.params.id;

    let updatedData = {};

    // 3. Parse social links safely
    if (socialLinks) {
      try {
        updatedData.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid socialLinks format" });
      }
    }

    if (req.file) {
      updatedData.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    }

    // ✅ Case 1: Vendor Update
    // We Map 'vendorName' -> 'name' and 'businessAddress' -> 'address' to preserve DB Schema
    if (role === "vendor" || vendorName) {
      if (vendorName) updatedData.vendorName = vendorName;
      if (businessAddress) updatedData.businessAddress = businessAddress;
      if (mobileNumber) updatedData.mobileNumber = mobileNumber;

      // Try finding by ID first
      let profile = await Profile.findByIdAndUpdate(id, updatedData, { new: true });

      // Fallback: If not found by ID, try finding by userId (just in case)
      if (!profile) {
        profile = await Profile.findOneAndUpdate({ userId: id }, updatedData, { new: true });
      }

      if (!profile)
        return res.status(404).json({ success: false, message: "Vendor profile not found" });

      return res.status(200).json({
        success: true,
        message: "Vendor updated successfully",
        data: profile,
      });
    }

    // ✅ Case 2: User Update (if needed)
    if (role === "user") {
      const updateFields = {
        firstName: firstName || vendorName, // fallback
        lastName: lastName || "",
        phone: mobileNumber || "",
        // User model doesn't usually have address, but if yours does:
        // address: businessAddress || "" 
      };

      if (updatedData.socialLinks) updateFields.socialMedia = updatedData.socialLinks;
      if (updatedData.profilePhoto) updateFields.profilePhoto = updatedData.profilePhoto;

      const user = await User.findByIdAndUpdate(id, updateFields, { new: true });

      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: user,
      });
    }

    return res.status(400).json({ success: false, message: "Invalid request" });

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


