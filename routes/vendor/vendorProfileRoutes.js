const express = require("express");
const router = express.Router();

const {
  createVendorProfile,
  getVendors,
  getVendor,
  updateVendorProfile,
  deleteVendorProfile,
  approveVendor,
  rejectVendor,
} = require("../../controllers/vendor/vendorProfilecontroller");

// Public or protected routes (use auth middleware if needed)
router.route("/")
  .get(getVendors)
  .post(createVendorProfile);

router.route("/:id")
  .get(getVendor)
  .put(updateVendorProfile)
  .delete(deleteVendorProfile);

router.patch("/:id/approve", approveVendor);
router.patch("/:id/reject", rejectVendor);

module.exports = router;
