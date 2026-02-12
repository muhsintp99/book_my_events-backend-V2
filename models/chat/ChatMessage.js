const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enquiry",
      required: true
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },

    message: {
      type: String,
      required: true
    },

    senderRole: {
      type: String, // "user" | "vendor"
      required: true
    },

    read: {
      type: Boolean,
      default: false
    },

    timestamp: {
      type: String, // Store ISO string from frontend
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
