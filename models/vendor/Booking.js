// const mongoose = require("mongoose");

// const bookingSchema = new mongoose.Schema(
//   {

//     moduleId: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Module",
//   required: true
// },
//     venueId: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
//     packageId: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },

//     providerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

//     fullName: { type: String },
//     contactNumber: { type: String },
//     emailAddress: { type: String },
//     address: { type: String },

//     numberOfGuests: { type: Number, required: true },
//     bookingDate: { type: Date, required: true },
//     timeSlot: { type: String, required: true }, // Morning / Evening / Full Day

//     location: { type: String },

//     bookingType: { type: String, enum: ["Direct", "Indirect"], default: "Direct" },

//     status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },

//     paymentStatus: {
//       type: String,
//       enum: ["Advance", "Pending", "Paid"],
//       default: "Pending"
//     },

//     conversationId: { type: String }, // Chat system

//     // pricing fields
//     perDayPrice: { type: Number, default: 0 },
//     perPersonCharge: { type: Number, default: 0 },
//     perHourCharge: { type: Number, default: 0 },
//     packagePrice: { type: Number, default: 0 },

//     totalBeforeDiscount: { type: Number, default: 0 },
//     discountValue: { type: Number, default: 0 },
//     discountType: { type: String, enum: ["flat", "percentage", "none"], default: "none" },

//     couponDiscountValue: { type: Number, default: 0 },
//     finalPrice: { type: Number, default: 0 }
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Booking", bookingSchema);



const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Common fields for all modules
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: true
    },
    
    // Module-specific reference fields (only one will be populated based on module)
    venueId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Venue",
      required: function() {
        return this.moduleType === "Venues";
      }
    },
    makeupId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Makeup",
      required: function() {
        return this.moduleType === "Makeup";
      }
    },
    // Add more module-specific IDs as needed
    // photographyId: { type: mongoose.Schema.Types.ObjectId, ref: "Photography" },
    // cateringId: { type: mongoose.Schema.Types.ObjectId, ref: "Catering" },

    packageId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Package", 
      // required: true 
    },

    providerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },

    // User details (for direct booking)
    fullName: { type: String },
    contactNumber: { type: String },
    emailAddress: { type: String },
    address: { type: String },

    // Common booking fields
    numberOfGuests: { 
      type: Number, 
      required: function() {
        return this.moduleType === "Venues"; // Only required for venues
      }
    },
    bookingDate: { type: Date, required: true },
    timeSlot: { type: String, }, 
    location: { type: String },
    
    bookingType: { 
      type: String, 
      enum: ["Direct", "Indirect"], 
      default: "Direct" 
    },

    // Status fields
    status: { 
      type: String, 
      enum: ["Pending", "Accepted", "Rejected"], 
      default: "Pending" 
    },

    paymentStatus: {
  type: String,
  enum: ["pending", "failed", "completed", "ongoing"],
  default: "pending"
},


    paymentType: {
      type: String,
      enum: ["Cash", "Card", "UPI", "GPay", "PhonePe", "Paytm", "Bank Transfer", "Net Banking", "Other"],
      default: null
    },

    conversationId: { type: String }, // Chat system

    // Pricing fields
    perDayPrice: { type: Number, default: 0 },
    perPersonCharge: { type: Number, default: 0 },
    perHourCharge: { type: Number, default: 0 },
    packagePrice: { type: Number, default: 0 },

    totalBeforeDiscount: { type: Number, default: 0 },
    discountValue: { type: Number, default: 0 },
    discountType: { 
      type: String, 
      enum: ["flat", "percentage", "none"], 
      default: "none" 
    },

    couponDiscountValue: { type: Number, default: 0 },
    finalPrice: { type: Number, default: 0 },

    // Store module type for easy querying
    moduleType: { type: String }
  },
  { timestamps: true }
);

// Index for faster queries
bookingSchema.index({ moduleId: 1, bookingDate: 1 });
bookingSchema.index({ providerId: 1, status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);