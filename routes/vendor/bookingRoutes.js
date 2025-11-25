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
// const express = require("express");
// const router = express.Router();
// const ctrl = require("../../controllers/vendor/bookingController");

// // CREATE
// router.post("/", ctrl.createBooking);

// // DETAILS
// router.get("/:id", ctrl.getBookingById);

// // UPCOMING / PAST
// router.get("/provider/:providerId/upcoming", ctrl.getUpcomingBookings);
// router.get("/provider/:providerId/past", ctrl.getPastBookings);

// // ACCEPT / REJECT
// router.patch("/:id/accept", ctrl.acceptBooking);
// router.patch("/:id/reject", ctrl.rejectBooking);

// // PAYMENT
// router.patch("/:id/payment", ctrl.updatePaymentStatus);

// // CHAT
// router.patch("/:id/chat", ctrl.addChatConversation);

// module.exports = router;



const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/vendor/bookingController");

// CREATE BOOKING
router.post("/", ctrl.createBooking);

// GET BOOKING DETAILS BY ID
router.get("/:id", ctrl.getBookingById);

// CHECK BOOKING TIMELINE (New endpoint)
// Returns if booking is Upcoming, Past, or Today
router.get("/:id/timeline", ctrl.checkBookingTimeline);

// GET BOOKINGS BY PROVIDER
router.get("/provider/:providerId", ctrl.getBookingsByProvider);

// GET UPCOMING BOOKINGS
router.get("/provider/:providerId/upcoming", ctrl.getUpcomingBookings);

// GET PAST BOOKINGS
router.get("/provider/:providerId/past", ctrl.getPastBookings);

// GET BOOKINGS BY PAYMENT STATUS
// Usage: GET /api/bookings/provider/:providerId/payment-status/:paymentStatus
// Example: GET /api/bookings/provider/123/payment-status/Paid
router.get("/provider/:providerId/payment-status/:paymentStatus", ctrl.getBookingsByPaymentStatus);

// ACCEPT BOOKING
router.patch("/:id/accept", ctrl.acceptBooking);

// REJECT BOOKING
router.patch("/:id/reject", ctrl.rejectBooking);

// UPDATE PAYMENT STATUS
router.patch("/:id/payment", ctrl.updatePaymentStatus);

// ADD CHAT CONVERSATION
router.patch("/:id/chat", ctrl.addChatConversation);

module.exports = router;