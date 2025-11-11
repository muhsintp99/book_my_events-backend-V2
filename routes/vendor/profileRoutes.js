const express = require("express");
const router = express.Router();
const profileController = require("../../controllers/vendor/profileController");
const createUpload = require("../../middlewares/upload");

const upload = createUpload("profiles", {
  fileSizeMB: 5,
  allowedTypes: ["image/jpeg", "image/png", "image/jpg"],
});

// Create a new profile
router.post("/", upload.single("profilePhoto"), profileController.createProfile);

// Get all profiles
router.get("/", profileController.getProfiles);

router.put("/:id", upload.single("profilePhoto"), profileController.updateProfile);


// Get single profile
router.get("/:id", profileController.getProfileById);

// ✅ Get profile by Provider ID (userId)
router.get("/provider/:providerId", profileController.getProfileByProviderId);

// Update profile
router.put("/:id", upload.single("profilePhoto"), profileController.updateProfile);

// Delete profile
router.delete("/:id", profileController.deleteProfile);

module.exports = router;
