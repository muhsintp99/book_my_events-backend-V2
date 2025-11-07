const express = require("express");
const router = express.Router();
const {
  createBooking,
  getBookingById,
  getBookingsByUser,
  getBookingsByProvider,
} = require("../../controllers/vendor/bookingController");

// POST create
router.post("/", createBooking);

// GET by ID
router.get("/:id", getBookingById);

// GET by userId
router.get("/user/:userId", getBookingsByUser);

// GET by providerId
router.get("/provider/:providerId", getBookingsByProvider);

module.exports = router;
