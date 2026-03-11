// const mongoose = require("mongoose");

// const enquirySchema = new mongoose.Schema(
//   {
//     // ✅ OPTIONAL for guest enquiries
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },

//     vendorId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },

//     moduleId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Module",
//       required: true,
//     },

//     packageId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: false,
//     },

//     bookingDate: Date,
//     fullName: String,
//     email: String,
//     contact: String,
//     description: String,

//     enquiryType: {
//       type: String,
//       enum: ["enquiry", "customization"],
//       default: "enquiry",
//     },

//     status: {
//       type: String,
//       default: "pending",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Enquiry", enquirySchema);
const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    // ✅ OPTIONAL for guest enquiries
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "moduleModel",
      default: null,
    },
    
    moduleModel: {
      type: String,
      enum: ["Module", "SecondaryModule"],
      default: "Module",
    },

    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    bookingDate: Date,
    fullName: String,
    email: String,
    contact: String,
    description: String,
    eventType: String, // Which event is this?

    enquiryType: {
      type: String,
      enum: ["enquiry", "customization"],
      default: "enquiry",
    },

    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);
