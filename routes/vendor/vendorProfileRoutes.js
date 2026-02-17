const express = require("express");
const router = express.Router();

const {
  createVendorProfile,
  getVendors,
  getVendor,
  getVendorByUser,
  updateVendorProfile,
  deleteVendorProfile,
  approveVendor,
  rejectVendor,
} = require("../../controllers/vendor/vendorProfilecontroller");

// Public or protected routes (use auth middleware if needed)
router.route("/")
  .get(getVendors)
  .post(createVendorProfile);

// ✅ Get vendor profile by USER ID (must be before /:id to avoid conflict)
router.get("/user/:userId", getVendorByUser);

router.route("/:id")
  .get(getVendor)
  .put(updateVendorProfile)
  .delete(deleteVendorProfile);

router.patch("/:id/approve", approveVendor);
router.patch("/:id/reject", rejectVendor);

module.exports = router;
