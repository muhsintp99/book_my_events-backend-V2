const express = require("express");
const router = express.Router();
const {
    getPendingRegistrations,
    getRegistrationDetail,
    approveRegistration,
    rejectRegistration,
} = require("../../controllers/admin/vendorRegistrationController");
const { protect, admin } = require("../../middlewares/authMiddleware");

// All routes protected by admin middleware
router.use(protect);
router.use(admin);

router.get("/pending", getPendingRegistrations);
router.get("/:id", getRegistrationDetail);
router.patch("/:id/approve", approveRegistration);
router.patch("/:id/reject", rejectRegistration);

module.exports = router;
