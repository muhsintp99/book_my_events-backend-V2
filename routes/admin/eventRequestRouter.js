const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/eventRequestController");
const { protect, adminOnly } = require("../../middlewares/authMiddleware");

// PUBLIC ROUTES (FROM WEBSITE)
router.post("/", controller.createEventRequest);

// ADMIN ROUTES
router.get("/admin", protect, adminOnly, controller.getAllEventRequests);
router.patch("/:id", protect, adminOnly, controller.updateEventRequestStatus);
router.delete("/:id", protect, adminOnly, controller.deleteEventRequest);

module.exports = router;
