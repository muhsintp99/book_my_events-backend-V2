const express = require("express");
const router = express.Router();
const profileController = require("../../controllers/vendor/profileController");
const createUpload = require("../../middlewares/upload");

const upload = createUpload("profiles", {
  fileSizeMB: 5,
  allowedTypes: ["image/jpeg", "image/png", "image/jpg"],
});

/*
========================================
        PROFILE ROUTES (FIXED)
========================================
*/

// Create Profile
router.post("/", upload.single("profilePhoto"), profileController.createProfile);

// Get All Profiles
router.get("/", profileController.getProfiles);

// Get ALL Vendors (NEW)
router.get("/vendors/all", profileController.getAllVendors);

router.get("/vendor/:providerId", profileController.getSingleVendor);

// Get Profile by Provider ID (userId) — MUST COME BEFORE /:id
router.get("/provider/:providerId", profileController.getProfileByProviderId);

// Get Single Profile by Profile ID
router.get("/:id", profileController.getProfileById);

// Update Profile
router.put("/:id", upload.single("profilePhoto"), profileController.updateProfile);

// Delete Profile
router.delete("/:id", profileController.deleteProfile);

module.exports = router;
