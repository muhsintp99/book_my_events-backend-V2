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



// const express = require("express");
// const router = express.Router();
// const ctrl = require("../../controllers/vendor/bookingController");

// // CREATE BOOKING
// router.post("/", ctrl.createBooking);

// // GET BOOKING DETAILS BY ID
// router.get("/:id", ctrl.getBookingById);

// // CHECK BOOKING TIMELINE (New endpoint)
// // Returns if booking is Upcoming, Past, or Today
// router.get("/:id/timeline", ctrl.checkBookingTimeline);

// // GET BOOKINGS BY PROVIDER
// router.get("/provider/:providerId", ctrl.getBookingsByProvider);

// // GET UPCOMING BOOKINGS
// router.get("/provider/:providerId/upcoming", ctrl.getUpcomingBookings);

// // GET PAST BOOKINGS
// router.get("/provider/:providerId/past", ctrl.getPastBookings);

// // GET BOOKINGS BY PAYMENT STATUS
// // Usage: GET /api/bookings/provider/:providerId/payment-status/:paymentStatus
// // Example: GET /api/bookings/provider/123/payment-status/Paid
// router.get("/provider/:providerId/payment-status/:paymentStatus", ctrl.getBookingsByPaymentStatus);

// // ACCEPT BOOKING
// router.patch("/:id/accept", ctrl.acceptBooking);

// // REJECT BOOKING
// router.patch("/:id/reject", ctrl.rejectBooking);

// // UPDATE PAYMENT STATUS
// router.patch("/:id/payment", ctrl.updatePaymentStatus);

// // ADD CHAT CONVERSATION
// router.patch("/:id/chat", ctrl.addChatConversation);

// module.exports = router;






const express = require("express");
const router = express.Router();
const ctrl = require("../../controllers/vendor/bookingController");

/* ========================================================
   FORCE TRIM URL AND PARAMS (Fix all trailing space issues)
======================================================== */
router.use((req, res, next) => {
   req.url = req.url.trim();
   Object.keys(req.params).forEach(key => {
      req.params[key] = req.params[key]?.trim();
   });
   next();
});

/* ========================================================
   STATIC ROUTES — MUST ALWAYS COME FIRST
======================================================== */
router.get("/check-availability", ctrl.checkAvailability); // ✅ NEW: Check Availability
router.get("/pending", ctrl.getPendingBookings);
router.get("/accepted", ctrl.getAcceptedBookings);
router.get("/completed", ctrl.getCompletedBookings);
router.get("/rejected", ctrl.getRejectedBookings);

/* ========================================================
   CREATE + ALL BOOKINGS
======================================================== */
router.post("/", ctrl.createBooking);
router.get("/", ctrl.getAllBookings);

/* ========================================================
   PROVIDER ROUTES
======================================================== */
router.get("/user/:userId", ctrl.getBookingsByUser);

router.get("/provider/:providerId", ctrl.getBookingsByProvider);
router.get("/provider/:providerId/payment-status/:paymentStatus", ctrl.getBookingsByPaymentStatus);
router.get("/provider/:providerId/upcoming", ctrl.getUpcomingBookings);
router.get("/provider/:providerId/past", ctrl.getPastBookings);

/* ========================================================
   ACTION ROUTES (PATCH)
======================================================== */
router.patch("/:id/accept", ctrl.acceptBooking);
router.patch("/:id/reject", ctrl.rejectBooking);
router.patch("/:id/cancel", ctrl.cancelBooking);  // ✅ NEW: Cancel booking
router.patch("/:id/payment", ctrl.updatePaymentStatus);
router.patch("/:id/chat", ctrl.addChatConversation);

/* ========================================================
   DYNAMIC ROUTE — MUST BE LAST
======================================================== */
router.get("/:id", ctrl.getBookingById);
router.delete("/:id", ctrl.deleteBooking);  // ✅ ADD THIS LINE

module.exports = router;
