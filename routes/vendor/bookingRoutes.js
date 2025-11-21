// const express = require("express");
// const router = express.Router();
// const {
//   createBooking,
//   getBookingById,
//   getBookingsByUser,
//   getBookingsByProvider,
// } = require("../../controllers/vendor/bookingController");

// // POST create
// router.post("/", createBooking);

// // GET by ID
// router.get("/:id", getBookingById);

// // GET by userId
// router.get("/user/:userId", getBookingsByUser);

// // GET by providerId
// router.get("/provider/:providerId", getBookingsByProvider);

// module.exports = router;


// routes/vendor/bookingRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/vendor/bookingController");

// CREATE
router.post("/", ctrl.createBooking);

// DETAILS
router.get("/:id", ctrl.getBookingById);

// UPCOMING / PAST
router.get("/provider/:providerId/upcoming", ctrl.getUpcomingBookings);
router.get("/provider/:providerId/past", ctrl.getPastBookings);

// ACCEPT / REJECT
router.patch("/:id/accept", ctrl.acceptBooking);
router.patch("/:id/reject", ctrl.rejectBooking);

// PAYMENT
router.patch("/:id/payment", ctrl.updatePaymentStatus);

// CHAT
router.patch("/:id/chat", ctrl.addChatConversation);

module.exports = router;
