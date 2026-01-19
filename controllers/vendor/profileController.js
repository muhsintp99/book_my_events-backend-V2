const mongoose = require("mongoose");
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
        select: "name description coordinates city country isActive isTopZone icon"
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

// DELETE ONLY VENDOR (VendorProfile only)
exports.deleteVendorOnly = async (req, res) => {
  try {
    const { vendorId } = req.params; // USER ID

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid vendor ID format"
      });
    }

    // Check VendorProfile
    const vendor = await VendorProfile.findOne({ user: vendorId });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    // Delete ONLY VendorProfile
    await VendorProfile.findOneAndDelete({ user: vendorId });

    return res.status(200).json({
      success: true,
      message: "Vendor deleted successfully (User & Profile retained)"
    });

  } catch (error) {
    console.error("Delete Vendor Only Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.getSingleVendor = async (req, res) => {
  try {
    const { providerId } = req.params;

    const vendor = await VendorProfile.findOne({ user: providerId })
      .populate("user", "firstName lastName email phone role profilePhoto")
      .populate("module", "title moduleId icon")
      .populate("zone", "name description coordinates city country isActive isTopZone icon");

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
    const profiles = await Profile.find().populate("userId", "firstName lastName email");
    res.status(200).json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single profile
exports.getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id).populate("userId", "firstName lastName email");
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

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ success: false, message: "Invalid provider ID format" });
    }

    console.log(`[getProfileByProviderId] Fetching profile for providerId: ${providerId}`);

    // 1. Try to find existing profile
    let profile = await Profile.findOne({ userId: providerId }).populate("userId", "firstName lastName email role");

    if (profile) {
      console.log(`[getProfileByProviderId] Profile found for user: ${providerId}`);
      return res.status(200).json({ success: true, data: profile });
    }

    console.log(`[getProfileByProviderId] No profile found, attempting auto-create for user: ${providerId}`);

    // 2. If no profile exists, checking if User exists to Auto-Create
    const user = await User.findById(providerId);
    if (!user) {
      console.error(`[getProfileByProviderId] User not found: ${providerId}`);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log(`[getProfileByProviderId] User found: ${user.firstName} ${user.lastName}, role: ${user.role}`);

    // 3. Check for VendorProfile to get better defaults
    const vendorProfile = await VendorProfile.findOne({ user: providerId });

    // 4. Prepare default data
    let vendorName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    let mobileNumber = user.phone || "";
    let businessAddress = "";

    if (vendorProfile) {
      console.log(`[getProfileByProviderId] VendorProfile found, using vendor data`);
      // User preference: Use Owner Name instead of Store Name
      const ownerFirst = vendorProfile.ownerFirstName || '';
      const ownerLast = vendorProfile.ownerLastName || '';
      vendorName = `${ownerFirst} ${ownerLast}`.trim();
      mobileNumber = vendorProfile.ownerPhone || mobileNumber;
      if (vendorProfile.storeAddress && vendorProfile.storeAddress.fullAddress) {
        businessAddress = vendorProfile.storeAddress.fullAddress;
      }
    } else {
      console.log(`[getProfileByProviderId] No VendorProfile found, using User data`);
    }

    // Ensure vendorName is not empty
    if (!vendorName) {
      vendorName = "Vendor";
    }

    console.log(`[getProfileByProviderId] Creating profile with data:`, {
      userId: providerId,
      vendorName,
      mobileNumber,
      businessAddress
    });

    // 5. Create new Profile
    profile = new Profile({
      userId: providerId,
      vendorName: vendorName,
      email: user.email, // Sync email
      mobileNumber: mobileNumber,
      businessAddress: businessAddress,
      socialLinks: {},
      bankDetails: vendorProfile ? vendorProfile.bankDetails : {}
    });

    try {
      await profile.save();
      // Re-fetch populated to get userId field if needed
      profile = await Profile.findById(profile._id).populate("userId", "firstName lastName email role");
      console.log(`[getProfileByProviderId] Profile created successfully for user: ${providerId}`);
    } catch (saveError) {
      if (saveError.code === 11000) {
        console.log(`[getProfileByProviderId] Profile already exists (race condition), fetching existing: ${providerId}`);
        profile = await Profile.findOne({ userId: providerId });
      } else {
        throw saveError;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Profile loaded successfully",
      data: profile
    });

  } catch (error) {
    console.error(`[getProfileByProviderId] Error:`, error);
    console.error(`[getProfileByProviderId] Error stack:`, error.stack);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
// exports.updateProfile = async (req, res) => {
//   try {
//     // 1. Accept ONLY the fields sent by Frontend
//     const { role, vendorName, firstName, lastName, businessAddress, mobileNumber, socialLinks } = req.body;

//     // 2. The ID in the URL is the PROFILE ID (based on your frontend call)
//     const id = req.params.id;

//     let updatedData = {};

//     // 3. Parse social links safely
//     if (socialLinks) {
//       try {
//         updatedData.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
//       } catch (err) {
//         return res.status(400).json({ success: false, message: "Invalid socialLinks format" });
//       }
//     }

//     if (req.file) {
//       updatedData.profilePhoto = `/uploads/profiles/${req.file.filename}`;
//     }

//     // ✅ Case 1: Vendor Update
//     // We Map 'vendorName' -> 'name' and 'businessAddress' -> 'address' to preserve DB Schema
//     if (role === "vendor" || vendorName) {
//       if (vendorName) updatedData.vendorName = vendorName;
//       if (businessAddress) updatedData.businessAddress = businessAddress;
//       if (mobileNumber) updatedData.mobileNumber = mobileNumber;

//       // Try finding by ID first
//       let profile = await Profile.findByIdAndUpdate(id, updatedData, { new: true });

//       // Fallback: If not found by ID, try finding by userId (just in case)
//       if (!profile) {
//         profile = await Profile.findOneAndUpdate({ userId: id }, updatedData, { new: true });
//       }

//       if (!profile)
//         return res.status(404).json({ success: false, message: "Vendor profile not found" });

//       return res.status(200).json({
//         success: true,
//         message: "Vendor updated successfully",
//         data: profile,
//       });
//     }

//     // ✅ Case 2: User Update
//     if (role === "user") {
//       // Logic: The 'id' param is likely the PROFILE ID, not User ID.
//       // We need to resolve the User ID from the Profile first.

//       let targetUserId = id; // Default to assuming it's User ID (legacy fallback)

//       // Try to find the profile to get the real User ID
//       const profileDoc = await Profile.findById(id);
//       if (profileDoc && profileDoc.userId) {
//         targetUserId = profileDoc.userId;
//       }

//       const updateFields = {
//         firstName: firstName || vendorName, // fallback
//         lastName: lastName || "",
//         phone: mobileNumber || "",
//       };

//       if (updatedData.socialLinks) updateFields.socialMedia = updatedData.socialLinks;
//       if (updatedData.profilePhoto) updateFields.profilePhoto = updatedData.profilePhoto;

//       const user = await User.findByIdAndUpdate(targetUserId, updateFields, { new: true });

//       if (!user) return res.status(404).json({ success: false, message: "User not found" });

//       return res.status(200).json({
//         success: true,
//         message: "User updated successfully",
//         data: user,
//       });
//     }

//     return res.status(400).json({ success: false, message: "Invalid request" });

//   } catch (error) {
//     console.error("Update Profile Error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };
// ✅ FIXED: Update profile - handles BOTH Profile ID and User ID

// ✅ UPDATE VENDOR BIO (FIX)
exports.updateVendorBio = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { bio } = req.body;

    if (!bio) {
      return res.status(400).json({
        success: false,
        message: "Bio data is required"
      });
    }

    const vendor = await VendorProfile.findOneAndUpdate(
      { user: vendorId },
      {
        $set: {
          "bio.title": bio.title || "",
          "bio.subtitle": bio.subtitle || "",
          "bio.description": bio.description || ""
        }
      },
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor bio updated successfully",
      data: vendor.bio
    });

  } catch (error) {
    console.error("Update Vendor Bio Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { role, vendorName, firstName, lastName, businessAddress, mobileNumber, socialLinks, bankDetails, latitude, longitude, storeAddress } = req.body;
    const id = req.params.id; // Could be Profile ID or User ID

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    console.log(`[updateProfile] Updating profile for ID: ${id}, role: ${role}`);

    let updatedData = {};

    // Parse social links safely
    if (socialLinks) {
      try {
        updatedData.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid socialLinks format" });
      }
    }

    // Parse bank details safely
    if (bankDetails) {
      try {
        updatedData.bankDetails = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid bankDetails format" });
      }
    }

    // Handle profile photo upload
    if (req.file) {
      updatedData.profilePhoto = `/uploads/profiles/${req.file.filename}`;
    }

    // ✅ VENDOR UPDATE
    if (role === "vendor" || vendorName) {
      if (vendorName) updatedData.vendorName = vendorName;
      if (businessAddress) updatedData.businessAddress = businessAddress;
      if (mobileNumber) updatedData.mobileNumber = mobileNumber;
      if (latitude) updatedData.latitude = latitude;
      if (longitude) updatedData.longitude = longitude;
      if (storeAddress) {
        try {
          updatedData.storeAddress = typeof storeAddress === 'string' ? JSON.parse(storeAddress) : storeAddress;
        } catch (err) {
          console.error("Invalid storeAddress JSON", err);
        }
      }

      let profile;

      // STRATEGY: Try multiple approaches to find the profile
      // 1. First try: Find by Profile ID
      profile = await Profile.findByIdAndUpdate(id, updatedData, { new: true }).populate("userId", "firstName lastName email role");

      // 2. Second try: Find by User ID (userId field)
      if (!profile) {
        profile = await Profile.findOneAndUpdate({ userId: id }, updatedData, { new: true }).populate("userId", "firstName lastName email role");
      }

      // 3. If STILL not found, auto-create the profile
      if (!profile) {
        console.log(`[updateProfile] Profile not found, attempting auto-create for user: ${id}`);

        // Verify user exists
        const user = await User.findById(id);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found. Cannot create profile.",
          });
        }

        // Check for VendorProfile to get better defaults
        const vendorProfile = await VendorProfile.findOne({ user: id });

        // Prepare profile data
        let defaultVendorName = vendorName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
        let defaultMobileNumber = mobileNumber || user.phone || "";
        let defaultBusinessAddress = businessAddress || "";

        if (vendorProfile) {
          if (!vendorName) {
            const ownerFirst = vendorProfile.ownerFirstName || '';
            const ownerLast = vendorProfile.ownerLastName || '';
            defaultVendorName = `${ownerFirst} ${ownerLast}`.trim();
          }
          if (!mobileNumber) {
            defaultMobileNumber = vendorProfile.ownerPhone || defaultMobileNumber;
          }
          if (!businessAddress && vendorProfile.storeAddress && vendorProfile.storeAddress.fullAddress) {
            defaultBusinessAddress = vendorProfile.storeAddress.fullAddress;
          }
        }

        // Ensure vendorName is not empty
        if (!defaultVendorName) {
          defaultVendorName = "Vendor";
        }

        // Create new profile
        profile = new Profile({
          userId: id,
          vendorName: defaultVendorName,
          email: user.email, // Sync email
          mobileNumber: defaultMobileNumber,
          businessAddress: defaultBusinessAddress,
          socialLinks: updatedData.socialLinks || {},
          bankDetails: updatedData.bankDetails || (vendorProfile ? vendorProfile.bankDetails : {}),
          profilePhoto: updatedData.profilePhoto || ""
        });

        try {
          await profile.save();
          // Re-fetch populated
          profile = await Profile.findById(profile._id).populate("userId", "firstName lastName email role");
          console.log(`[updateProfile] Profile created successfully for user: ${id}`);
        } catch (saveError) {
          if (saveError.code === 11000) {
            console.log(`[updateProfile] Profile already exists (race condition), updating instead: ${id}`);
            profile = await Profile.findOneAndUpdate({ userId: id }, updatedData, { new: true });
          } else {
            throw saveError;
          }
        }

        return res.status(200).json({
          success: true,
          message: "Profile updated successfully",
          data: profile,
        });
      }

      console.log(`[updateProfile] Vendor profile updated successfully for user: ${id}`);
      return res.status(200).json({
        success: true,
        message: "Vendor profile updated successfully",
        data: profile,
      });
    }

    // ✅ USER UPDATE
    if (role === "user") {
      let targetUserId = id; // Default assumption

      // Try to find profile and extract the actual User ID
      const profileDoc = await Profile.findById(id);
      if (profileDoc && profileDoc.userId) {
        targetUserId = profileDoc.userId;
      }

      const updateFields = {
        firstName: firstName || vendorName,
        lastName: lastName || "",
        phone: mobileNumber || "",
      };

      if (updatedData.socialLinks) updateFields.socialMedia = updatedData.socialLinks;
      if (updatedData.profilePhoto) updateFields.profilePhoto = updatedData.profilePhoto;

      const user = await User.findByIdAndUpdate(targetUserId, updateFields, { new: true });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
          debug: { attemptedUserId: targetUserId }
        });
      }

      console.log(`[updateProfile] User profile updated successfully for user: ${targetUserId}`);
      return res.status(200).json({
        success: true,
        message: "User profile updated successfully",
        data: user,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Invalid request. Please provide a valid role (vendor or user)"
    });

  } catch (error) {
    console.error("[updateProfile] Error:", error);
    console.error("[updateProfile] Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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

// --- KYC CONTROLLERS ---

// Save KYC details
exports.saveKyc = async (req, res) => {
  try {
    let { userId, personalInfo, documentInfo, bankDetails, data } = req.body;

    // ✅ SUPPORT FOR SINGLE JSON PAYLOAD (Frontend/Postman Convenience)
    // Allows sending { data: JSON_STRING, frontImage: FILE, backImage: FILE }
    if (data) {
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        userId = parsedData.userId || userId;
        personalInfo = parsedData.personalInfo || personalInfo;
        documentInfo = parsedData.documentInfo || documentInfo;
        bankDetails = parsedData.bankDetails || bankDetails;
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid JSON format in 'data' field" });
      }
    }

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Parse JSON strings if they come as strings (from form-data)
    let parsedPersonalInfo = typeof personalInfo === 'string' ? JSON.parse(personalInfo) : personalInfo;
    let parsedDocumentInfo = typeof documentInfo === 'string' ? JSON.parse(documentInfo) : documentInfo;
    let parsedBankDetails = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;

    // Handle files
    const frontImage = req.files?.frontImage ? `/uploads/profiles/${req.files.frontImage[0].filename}` : null;
    const backImage = req.files?.backImage ? `/uploads/profiles/${req.files.backImage[0].filename}` : null;

    if (frontImage) parsedDocumentInfo.frontImage = frontImage;
    if (backImage) parsedDocumentInfo.backImage = backImage;

    const updateData = {
      kycDetails: {
        personalInfo: parsedPersonalInfo,
        documentInfo: parsedDocumentInfo,
        bankDetails: parsedBankDetails,
        status: 'pending',
        submittedAt: new Date()
      }
    };

    let profile = await Profile.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: "KYC details submitted successfully",
      data: profile.kycDetails
    });
  } catch (error) {
    console.error("Save KYC Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get KYC details
exports.getKyc = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const profile = await Profile.findOne({ userId });

    if (!profile || !profile.kycDetails) {
      return res.status(404).json({
        success: false,
        message: "KYC details not found",
        data: { status: 'not_submitted' }
      });
    }

    res.status(200).json({
      success: true,
      data: profile.kycDetails
    });
  } catch (error) {
    console.error("Get KYC Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


