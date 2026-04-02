const mongoose = require("mongoose");

const eventRequestSchema = new mongoose.Schema(
  {
    eventType: {
      type: [String],
      required: true,
    },
    eventDate: {
      type: String,
      required: true,
    },
    guestCount: {
      type: Number,
      required: true,
    },
    eventLocation: {
      type: String,
      required: true,
    },
    minBudget: {
      type: Number,
      required: false,
    },
    maxBudget: {
      type: Number,
      required: false,
    },
    fullName: {
      type: String,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "interested", "contacted", "follow_up", "confirmed", "cancelled", "closed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const EventRequest = mongoose.model("EventRequest", eventRequestSchema);
module.exports = EventRequest;
