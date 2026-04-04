const mongoose = require("mongoose");
const Profile = require("../../models/vendor/Profile");
const VendorProfile = require("../../models/vendor/vendorProfile");
const User = require("../../models/User");

// Module Models
const Vehicle = require("../../models/vendor/Vehicle");
const Cake = require("../../models/vendor/cakePackageModel");
const Catering = require("../../models/vendor/Catering");
const Photography = require("../../models/vendor/PhotographyPackage");
const Venue = require("../../models/vendor/Venue");
const Makeup = require("../../models/admin/makeupPackageModel");
const Package = require("../../models/admin/Package");

const Booking = require("../../models/vendor/Booking");
const Ornament = require("../../models/vendor/ornamentPackageModel");
const Boutique = require("../../models/vendor/boutiquePackageModel");
const Bouncers = require("../../models/vendor/bouncerPackageModel");
const Emcee = require("../../models/vendor/emceePackageModel");
const EventPro = require("../../models/vendor/eventProfessionalPackageModel");
const Florist = require("../../models/vendor/floristPackageModel");
const Invitation = require("../../models/vendor/invitationPackageModel");
const LightAndSound = require("../../models/vendor/lightAndSoundPackageModel");
const Mehandi = require("../../models/vendor/mehandiPackageModel");
const Panthal = require("../../models/vendor/panthalDecorationPackageModel");

// Create a new profile

exports.getAllVendors = async (req, res) => {
  try {
    const { sort, order = "desc" } = req.query;

    const vendors = await VendorProfile.find()
      .populate({
        path: "user",
        select: "firstName lastName email phone role profilePhoto"
      })
      .populate({
        path: "module",
        select: "title moduleId icon"
      })
      .populate({
        path: "zones",
        select: "name description coordinates city country isActive isTopZone icon"
      })
      .populate("services", "title")
      .populate("specialised", "title");

    // Enhance vendors with counts
    const enhancedVendors = await Promise.all(
      vendors.map(async (v) => {
        const userRef = v.user?._id;
        const profileRef = v._id;

        const [vehicles, cakes, catering, photography, venues, makeup, genericPackages, ornaments, boutiques, bouncers, emcees, eventpros, florists, invitations, lights, mehandis, panthals, bookings] = await Promise.all([
          Vehicle.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Cake.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Catering.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Photography.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Venue.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Makeup.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Package.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Ornament.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Boutique.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Bouncers.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Emcee.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          EventPro.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Florist.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Invitation.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          LightAndSound.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Mehandi.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Panthal.countDocuments({ provider: { $in: [userRef, profileRef] } }),
          Booking.countDocuments({ providerId: userRef })
        ]);

        if (v.user?.email === 'muhammedamantext@gmail.com') {
          console.log('DEBUG COUNTS for muhammedamantext@gmail.com:', {
            vendorId: userRef,
            profileId: profileRef,
            vehicles,
            cakes,
            catering,
            photography,
            venues,
            makeup,
            genericPackages,
            ornaments,
            bookings
          });
        }

        return {
          ...v.toObject(),
          packageCount: vehicles + cakes + catering + photography + venues + makeup + genericPackages + ornaments + boutiques + bouncers + emcees + eventpros + florists + invitations + lights + mehandis + panthals,
          bookingCount: bookings
        };
      })
    );

    // Sorting
    if (sort === "packageCount") {
      enhancedVendors.sort((a, b) =>
        order === "asc" ? a.packageCount - b.packageCount : b.packageCount - a.packageCount
      );
    } else if (sort === "bookingCount") {
      enhancedVendors.sort((a, b) =>
        order === "asc" ? a.bookingCount - b.bookingCount : b.bookingCount - a.bookingCount
      );
    }

    return res.status(200).json({
      success: true,
      count: enhancedVendors.length,
      data: enhancedVendors
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

    // 2. Clear out all associated data (Perform in parallel)
    console.log(`[deleteVendorOnly] Cleaning up data for provider: ${vendorId}`);
    await Promise.all([
      Vehicle.deleteMany({ provider: vendorId }),
      Cake.deleteMany({ provider: vendorId }),
      Catering.deleteMany({ provider: vendorId }),
      Photography.deleteMany({ provider: vendorId }),
      Venue.deleteMany({ provider: vendorId }),
      Makeup.deleteMany({ provider: vendorId }),
      Package.deleteMany({ provider: vendorId }),

      Ornament.deleteMany({ provider: vendorId }),
      Boutique.deleteMany({ provider: vendorId }),
      Bouncers.deleteMany({ provider: vendorId }),
      Emcee.deleteMany({ provider: vendorId }),
      EventPro.deleteMany({ provider: vendorId }),
      Florist.deleteMany({ provider: vendorId }),
      Invitation.deleteMany({ provider: vendorId }),
      LightAndSound.deleteMany({ provider: vendorId }),
      Mehandi.deleteMany({ provider: vendorId }),
      Panthal.deleteMany({ provider: vendorId }),
      Booking.deleteMany({ providerId: vendorId }),
      Profile.findOneAndDelete({ userId: vendorId }),
      VendorProfile.findOneAndDelete({ user: vendorId }),
      User.findByIdAndDelete(vendorId)
    ]);

    return res.status(200).json({
      success: true,
      message: "Vendor and all associated data deleted successfully. Email is now free."
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
      .populate("services", "title")
      .populate("specialised", "title")
      .populate("zones", "name description coordinates city country isActive isTopZone icon");

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

      // ✅ ROBUST SYNC: If profile exists but missing photo/cover, sync from VendorProfile
      const vendorProfile = await VendorProfile.findOne({ user: providerId });
      let needsSave = false;

      if (vendorProfile && (!profile.profilePhoto || profile.profilePhoto === "") && vendorProfile.logo) {
        profile.profilePhoto = vendorProfile.logo;
        needsSave = true;
      }
      if (vendorProfile && (!profile.coverImage || profile.coverImage === "") && vendorProfile.coverImage) {
        profile.coverImage = vendorProfile.coverImage;
        needsSave = true;
      }

      if (needsSave) {
        await profile.save();
        console.log(`[getProfileByProviderId] Synced missing photo/cover to Profile for: ${providerId}`);
      }

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
      bankDetails: vendorProfile ? vendorProfile.bankDetails : {},
      profilePhoto: vendorProfile?.logo || user.profilePhoto || "",
      coverImage: vendorProfile?.coverImage || ""
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

    // 6. Include zone information in the response for convenience
    const profileObj = profile.toObject();
    if (vendorProfile) {
      profileObj.zones = vendorProfile.zones;
      profileObj.zone = vendorProfile.zones?.[0] || null;
    }

    return res.status(200).json({
      success: true,
      message: "Profile loaded successfully",
      data: profileObj
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
// exports.updateProfile = async (req, res) => { ... } (legacy commented out)

// ✅ UPDATE VENDOR BIO
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
    const {
      role,
      vendorName,
      firstName,
      lastName,
      email,
      businessAddress,
      mobileNumber,
      socialLinks,
      bankDetails,
      latitude,
      longitude,
      storeAddress,
      vendorType,
      maxBookings,
      services,
      specialised,
      startingPrice,
      minBookingPrice,
      bioTitle,
      bioSubtitle,
      bioDescription,
      zone,
      zones,
      module
    } = req.body;
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

    // Handle cover image upload
    if (req.files) {
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        updatedData.profilePhoto = `/uploads/profiles/${req.files.profilePhoto[0].filename}`;
      }
      if (req.files.coverImage && req.files.coverImage[0]) {
        updatedData.coverImage = `/uploads/profiles/${req.files.coverImage[0].filename}`;
      }
    }

    // ✅ VENDOR UPDATE
    if (role === "vendor" || vendorName) {
      if (vendorName) updatedData.vendorName = vendorName;
      if (businessAddress) updatedData.businessAddress = businessAddress;
      if (mobileNumber) updatedData.mobileNumber = mobileNumber;
      if (latitude) updatedData.latitude = latitude;
      if (longitude) updatedData.longitude = longitude;
      if (vendorType) updatedData.vendorType = vendorType;
      if (maxBookings !== undefined) updatedData.maxBookings = maxBookings;

      // Handle Bio fields
      if (bioTitle !== undefined || bioSubtitle !== undefined || bioDescription !== undefined) {
        updatedData.bio = {
          title: bioTitle !== undefined ? bioTitle : "",
          subtitle: bioSubtitle !== undefined ? bioSubtitle : "",
          description: bioDescription !== undefined ? bioDescription : ""
        };
      }

      if (services) {
        try {
          updatedData.services = typeof services === 'string' ? JSON.parse(services) : services;
        } catch (err) {
          console.error("Invalid services JSON", err);
        }
      }
      if (specialised) updatedData.specialised = specialised;
      if (startingPrice !== undefined) updatedData.startingPrice = startingPrice;
      if (minBookingPrice !== undefined) updatedData.minBookingPrice = minBookingPrice;
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
          profilePhoto: updatedData.profilePhoto || vendorProfile?.logo || user.profilePhoto || "",
          coverImage: updatedData.coverImage || vendorProfile?.coverImage || ""
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
      }

      // NEW: ROBUST SYNC TO USER AND VENDORPROFILE
      let userIdStr = id;
      if (profile.userId) {
        userIdStr = profile.userId._id ? profile.userId._id.toString() : profile.userId.toString();
      }

      const targetUserId = mongoose.Types.ObjectId.isValid(userIdStr)
        ? new mongoose.Types.ObjectId(userIdStr)
        : null;

      if (targetUserId) {
        console.log(`[updateProfile] Initiating sync for User ID: ${targetUserId}`);

        // Prepare name fields
        const rawName = (vendorName || profile.vendorName || "Vendor").trim();
        const nameParts = rawName.split(/\s+/);
        const firstNameSync = nameParts[0] || "Vendor";
        let lastNameSync = nameParts.slice(1).join(" ") || " ";

        // Update User Model
        try {
          const userObj = await User.findById(targetUserId);
          if (userObj) {
            let userFieldUpdated = false;
            let emailChanged = false;
            let newPassword = null;

            if (email && email.trim() !== '') {
              const newEmail = email.trim().toLowerCase();
              if (newEmail !== userObj.email.toLowerCase()) {
                const existingUser = await User.findOne({ email: newEmail });
                if (existingUser && existingUser._id.toString() !== userObj._id.toString()) {
                  return res.status(400).json({ success: false, message: `The email address ${newEmail} is already registered` });
                }
                userObj.email = newEmail;
                newPassword = Math.random().toString(36).slice(-8);
                userObj.password = newPassword;
                emailChanged = true;
                userFieldUpdated = true;
              }
            }

            if (firstNameSync !== userObj.firstName) { userObj.firstName = firstNameSync; userFieldUpdated = true; }
            if (lastNameSync !== userObj.lastName) { userObj.lastName = lastNameSync; userFieldUpdated = true; }
            
            const mobileInput = mobileNumber || profile.mobileNumber;
            if (mobileInput && mobileInput !== userObj.phone) {
              userObj.phone = mobileInput;
              userObj.mobile = mobileInput;
              userFieldUpdated = true;
            }

            if (updatedData.socialLinks) { userObj.socialMedia = updatedData.socialLinks; userFieldUpdated = true; }
            if (updatedData.profilePhoto) { userObj.profilePhoto = updatedData.profilePhoto; userFieldUpdated = true; }

            if (userFieldUpdated) {
              await userObj.save();
              if (emailChanged) {
                try {
                  const sendEmail = require("../../utils/sendEmail");
                  const { vendorUpdateEmail } = require("../../utils/sentEmail");
                  await sendEmail(userObj.email, "Updated Credentials", vendorUpdateEmail(userObj, newPassword));
                } catch (e) {}
              }
            }
          }
        } catch (userErr) {}

        // Update VendorProfile Model
        const vendorUpdateFields = {
          storeName: rawName,
          ownerFirstName: firstNameSync,
          ownerLastName: lastNameSync,
          ownerPhone: mobileNumber || profile.mobileNumber,
          latitude: latitude || updatedData.latitude,
          longitude: longitude || updatedData.longitude,
          bio: updatedData.bio || profile.bio,
          module: module || updatedData.module
        };

        if (zones || zone) {
          let zonesArray = zones ? (typeof zones === 'string' ? zones.split(',') : zones) : [];
          if (zone && !zonesArray.includes(zone)) zonesArray.push(zone);
          vendorUpdateFields.zones = zonesArray.filter(z => mongoose.Types.ObjectId.isValid(z));
        }

        if (businessAddress || profile.businessAddress) {
          vendorUpdateFields.storeAddress = { fullAddress: businessAddress || profile.businessAddress };
        }

        if (updatedData.storeAddress) vendorUpdateFields.storeAddress = updatedData.storeAddress;
        if (updatedData.profilePhoto) vendorUpdateFields.logo = updatedData.profilePhoto;
        if (updatedData.coverImage) vendorUpdateFields.coverImage = updatedData.coverImage;

        await VendorProfile.findOneAndUpdate({ user: targetUserId }, { $set: vendorUpdateFields });
      }

      const finalResponse = profile.toObject();
      const finalVendorProfile = await VendorProfile.findOne({ user: targetUserId }).populate("zones", "name city");
      if (finalVendorProfile) {
        finalResponse.zones = finalVendorProfile.zones;
        finalResponse.zone = finalVendorProfile.zones?.[0] || null;
      }

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: finalResponse,
      });
    }

    // ✅ USER UPDATE
    if (role === "user") {
      let targetUserId = id;
      const profileDoc = await Profile.findById(id);
      if (profileDoc && profileDoc.userId) targetUserId = profileDoc.userId;

      const updateFields = {
        firstName: firstName || vendorName,
        lastName: lastName || "",
        phone: mobileNumber || "",
      };

      if (updatedData.socialLinks) updateFields.socialMedia = updatedData.socialLinks;
      if (updatedData.profilePhoto) updateFields.profilePhoto = updatedData.profilePhoto;

      const user = await User.findByIdAndUpdate(targetUserId, updateFields, { new: true });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      return res.status(200).json({ success: true, message: "User updated successfully", data: user });
    }

    return res.status(400).json({ success: false, message: "Invalid role" });

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

// --- KYC CONTROLLERS ---

// Save KYC details
exports.saveKyc = async (req, res) => {
  try {
    let { userId, personalInfo, documentInfo, bankDetails, data } = req.body;

    if (data) {
      try {
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        userId = parsedData.userId || userId;
        personalInfo = parsedData.personalInfo || personalInfo;
        documentInfo = parsedData.documentInfo || documentInfo;
        bankDetails = parsedData.bankDetails || bankDetails;
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid JSON" });
      }
    }

    if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

    let parsedPersonalInfo = typeof personalInfo === 'string' ? JSON.parse(personalInfo) : personalInfo;
    let parsedDocumentInfo = typeof documentInfo === 'string' ? JSON.parse(documentInfo) : documentInfo;
    let parsedBankDetails = typeof bankDetails === 'string' ? JSON.parse(bankDetails) : bankDetails;

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

    let profile = await Profile.findOneAndUpdate({ userId }, updateData, { new: true, upsert: true });

    res.status(200).json({ success: true, message: "KYC submitted", data: profile.kycDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get KYC details
exports.getKyc = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await Profile.findOne({ userId });
    if (!profile || !profile.kycDetails) {
      return res.status(404).json({ success: false, message: "KYC not found", data: { status: 'not_submitted' } });
    }
    res.status(200).json({ success: true, data: profile.kycDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET PROVIDER FULL DETAILS (ADMIN)
exports.getProviderAdminDetails = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ success: false, message: "Invalid provider ID" });
    }

    const [user, profile, vendorProfile] = await Promise.all([
      User.findById(providerId).select("-password -refreshToken -otp"),
      Profile.findOne({ userId: providerId }),
      VendorProfile.findOne({ user: providerId })
        .populate("module", "title moduleId icon")
        .populate("services", "title")
        .populate("specialised", "title")
        .populate("zones", "name description city country isActive isTopZone icon")
    ]);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const [vehicles, cakes, catering, photography, venues, makeup, genericPackages, ornaments, boutiques, bouncers, emcees, eventpros, florists, invitations, lights, mehandis, panthals] = await Promise.all([
      Vehicle.find({ provider: providerId }).populate("category brand zone"),
      Cake.find({ provider: providerId }).populate("category module"),
      Catering.find({ provider: providerId }).populate("categories module"),
      Photography.find({ provider: providerId }).populate("categories module"),
      Venue.find({ provider: providerId }).populate("categories module packages"),
      Makeup.find({ provider: providerId }).populate("categories module"),

      Package.find({ provider: providerId }).populate("categories module"),
      Ornament.find({ provider: providerId }).populate("category subCategory module"),
      Boutique.find({ provider: providerId }).populate("category subCategory module"),
      Bouncers.find({ provider: providerId }).populate("services secondaryModule"),
      Emcee.find({ provider: providerId }).populate("services secondaryModule"),
      EventPro.find({ provider: providerId }).populate("services secondaryModule"),
      Florist.find({ provider: providerId }).populate("services secondaryModule"),
      Invitation.find({ provider: providerId }).populate("services secondaryModule"),
      LightAndSound.find({ provider: providerId }).populate("services secondaryModule"),
      Mehandi.find({ provider: providerId }).populate("services secondaryModule"),
      Panthal.find({ provider: providerId }).populate("services secondaryModule")
    ]);

    const bookings = await Booking.find({ providerId: providerId })
      .populate("userId", "firstName lastName email phone")
      .populate("moduleId", "title icon")
      .populate("vehicleId", "name licensePlateNumber")
      .populate("cakeId", "name thumbnail")
      .populate("venueId", "venueName thumbnail")
      .populate("photographyId", "packageTitle thumbnail")
      .populate("cateringId", "title thumbnail")
      .populate("makeupId", "packageTitle thumbnail")
      .sort({ createdAt: -1 });

    const fullProfile = {
      user,
      profile: profile || null,
      vendorProfile: vendorProfile || null,
      banner: vendorProfile?.coverImage || "",
      logo: vendorProfile?.logo || profile?.profilePhoto || user?.profilePhoto || ""
    };

    const allPackages = [
      ...vehicles.map(p => ({ ...p.toObject(), type: "Vehicle" })),
      ...cakes.map(p => ({ ...p.toObject(), type: "Cake" })),
      ...catering.map(p => ({ ...p.toObject(), type: "Catering" })),
      ...photography.map(p => ({ ...p.toObject(), type: "Photography" })),
      ...venues.map(p => ({ ...p.toObject(), type: "Venue" })),
      ...makeup.map(p => ({ ...p.toObject(), type: "Makeup" })),

      ...genericPackages.map(p => ({ ...p.toObject(), type: "Package" })),
      ...ornaments.map(p => ({ ...p.toObject(), type: "Ornament" })),
      ...boutiques.map(p => ({ ...p.toObject(), type: "Boutique" })),
      ...bouncers.map(p => ({ ...p.toObject(), type: "Bouncers" })),
      ...emcees.map(p => ({ ...p.toObject(), type: "Emcee" })),
      ...eventpros.map(p => ({ ...p.toObject(), type: "EventPro" })),
      ...florists.map(p => ({ ...p.toObject(), type: "Florist" })),
      ...invitations.map(p => ({ ...p.toObject(), type: "Invitation" })),
      ...lights.map(p => ({ ...p.toObject(), type: "LightAndSound" })),
      ...mehandis.map(p => ({ ...p.toObject(), type: "Mehandi" })),
      ...panthals.map(p => ({ ...p.toObject(), type: "Panthal" }))
    ];

    return res.status(200).json({
      success: true,
      data: {
        profile: fullProfile,
        packages: allPackages,
        bookings: bookings,
        stats: {
          totalPackages: allPackages.length,
          totalBookings: bookings.length,
          activePackages: allPackages.filter(p => p.isActive).length
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ GET VENDOR COLLECTION DETAILS (USER, PROFILE, VENDORPROFILE)
exports.getVendorCollectionDetails = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({ success: false, message: "Invalid provider ID" });
    }

    const [user, profile, vendorProfile] = await Promise.all([
      User.findById(providerId).select("firstName lastName email phone profilePhoto"),
      Profile.findOne({ userId: providerId }).select("-bankDetails -kycDetails"),
      VendorProfile.findOne({ user: providerId })
        .populate("services", "title")
        .populate("specialised", "title")
        .populate("zones", "name description city country")
    ]);

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const responseData = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePhoto: user.profilePhoto
      },
      profile: profile ? {
        socialMediaLinks: profile.socialLinks || {},
        vendorName: profile.vendorName,
        businessAddress: profile.businessAddress,
        profilePhoto: profile.profilePhoto,
        coverImage: profile.coverImage
      } : null,
      vendorProfile: vendorProfile ? {
        storeName: vendorProfile.storeName,
        storeAddress: vendorProfile.storeAddress,
        logo: vendorProfile.logo || "",
        coverImage: vendorProfile.coverImage || "",
        latitude: vendorProfile.latitude,
        longitude: vendorProfile.longitude,
        zones: vendorProfile.zones,
        zone: vendorProfile.zones?.[0] || null,
        subscriptionStatus: vendorProfile.subscriptionStatus
      } : null
    };

    return res.status(200).json({
      success: true,
      message: "Vendor collection details fetched successfully",
      data: responseData
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};