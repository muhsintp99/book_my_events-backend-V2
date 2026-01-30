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
        PROFILE ROUTES (FINAL FIX)
========================================
*/

/* ---------- VENDOR ROUTES (TOP PRIORITY) ---------- */

// Get ALL Vendors
router.get("/vendors/all", profileController.getAllVendors);
router.get("/debug/ornaments", async (req, res) => {
  try {
    const Ornament = require("../../models/vendor/ornamentPackageModel");
    const ornaments = await Ornament.find({}).select("provider name").lean();
    const counts = await Ornament.countDocuments({});
    res.json({ counts, ornaments });
  } catch (err) {
    res.json({ error: err.message });
  }
});
// ✅ UPDATE VENDOR BIO
router.put(
  "/vendor/:vendorId/bio",
  profileController.updateVendorBio
);


// Get Single Vendor
router.get("/vendor/:providerId", profileController.getSingleVendor);

// ✅ DELETE VENDOR ONLY (FIXED)
router.delete("/vendor/:vendorId", profileController.deleteVendorOnly);

// ✅ GET PROVIDER FULL DETAILS (ADMIN)
router.get("/admin/vendor/:providerId/details", profileController.getProviderAdminDetails);

// ✅ GET VENDOR COLLECTION DETAILS (Aggregated User, Profile, VendorProfile)
router.get("/vendor/:providerId/collection-details", profileController.getVendorCollectionDetails);

/* ---------- PROFILE ROUTES ---------- */

// Create Profile
router.post("/", upload.single("profilePhoto"), profileController.createProfile);

// Get All Profiles
router.get("/", profileController.getProfiles);

// Get Profile by Provider ID
router.get("/provider/:providerId", profileController.getProfileByProviderId);

// Update Profile (with profilePhoto and coverImage)
router.put("/:id", upload.fields([
  { name: "profilePhoto", maxCount: 1 },
  { name: "coverImage", maxCount: 1 }
]), profileController.updateProfile);

// Delete Profile
router.delete("/:id", profileController.deleteProfile);

/* ---------- KYC ROUTES ---------- */

router.post(
  "/kyc",
  upload.fields([
    { name: "frontImage", maxCount: 1 },
    { name: "backImage", maxCount: 1 }
  ]),
  profileController.saveKyc
);

router.get("/kyc/:userId", profileController.getKyc);

module.exports = router;
