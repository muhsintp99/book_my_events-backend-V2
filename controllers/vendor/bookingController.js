const mongoose = require("mongoose");
const axios = require("axios");
const Booking = require("../../models/vendor/Booking");
const User = require("../../models/User");
const Venue = require("../../models/vendor/Venue");
const Makeup = require("../../models/admin/makeupPackageModel");
const Package = require("../../models/admin/Package");
const Profile = require("../../models/vendor/Profile");
const Coupon = require("../../models/admin/coupons");
const Module = require("../../models/admin/module");
const Photography = require("../../models/vendor/PhotographyPackage");
const Catering = require("../../models/vendor/Catering");
const Vehicle = require("../../models/vendor/Vehicle");
const Cake = require("../../models/vendor/cakePackageModel");
const Ornament = require("../../models/vendor/ornamentPackageModel");
const Boutique = require("../../models/vendor/boutiquePackageModel");

const AUTH_API_URL = "https://api.bookmyevent.ae/api/auth/login";

// =======================================================
// HELPER: CALCULATE TIMELINE
// =======================================================
function calculateTimeline(bookingDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookingDateOnly = new Date(bookingDate);
  bookingDateOnly.setHours(0, 0, 0, 0);

  const isUpcoming = bookingDateOnly >= today;
  const isPast = bookingDateOnly < today;
  const isToday = bookingDateOnly.getTime() === today.getTime();

  const daysDifference = Math.ceil(
    (bookingDateOnly - today) / (1000 * 60 * 60 * 24)
  );

  return {
    status: isToday ? "Today" : isUpcoming ? "Upcoming" : "Past",
    isUpcoming,
    isPast,
    isToday,
    daysUntil: isUpcoming && !isToday ? daysDifference : null,
    daysAgo: isPast ? Math.abs(daysDifference) : null,
    message: isToday
      ? "This booking is scheduled for TODAY!"
      : isUpcoming
        ? `This booking is ${daysDifference} day(s) away`
        : `This booking was ${Math.abs(daysDifference)} day(s) ago`,
  };
}

// =======================================================
// HELPER: NORMALIZE EXTRA PRICE (Handle Object vs Number)
// =======================================================
function normalizeExtraPrice(value) {
  if (typeof value === "number") return value;
  if (typeof value === "object" && value !== null) {
    return Number(value.price || 0);
  }
  return Number(value) || 0;
}

// =======================================================
// CREATE BOOKING (UNIFIED FOR ALL MODULES)
// =======================================================
// exports.createBooking = async (req, res) => {
//   try {
//     const {
//       moduleId,
//       venueId,
//       makeupId,
//       packageId,
//       numberOfGuests,
//       photographyId,
//       bookingDate,
//       timeSlot,
//       bookingType,
//       userId,
//       couponId,
//       fullName,
//       contactNumber,
//       emailAddress,
//       address,
//       paymentType, // NEW: Payment method
//     } = req.body;

//     // Validate common required fields
//     // if (!moduleId  || !bookingDate ) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: "moduleId, packageId, bookingDate, and timeSlot are required"
//     //   });
//     // }
//     if (!moduleId || !bookingDate) {
//       return res.status(400).json({
//         success: false,
//         message: "moduleId and bookingDate are required",
//       });
//     }

//     // Validate MongoDB ObjectId format
//     const mongoose = require("mongoose");
//     if (!mongoose.Types.ObjectId.isValid(moduleId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid moduleId format",
//       });
//     }
//     // if (!mongoose.Types.ObjectId.isValid(packageId)) {
//     //   return res.status(400).json({
//     //     success: false,
//     //     message: "Invalid packageId format"
//     //   });
//     // }

//     // Get module information
//     const moduleData = await Module.findById(moduleId);
//     if (!moduleData) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid moduleId",
//       });
//     }

//     const moduleType = moduleData.title; // e.g., "Venues", "Makeup", etc.

//     // Module-specific validation and data fetching
//     let serviceProvider = null;
//     let pricingData = null;

//     switch (moduleType) {
//       case "Venues":
//         if (!venueId) {
//           return res.status(400).json({
//             success: false,
//             message: "venueId is required for Venues module",
//           });
//         }
//         if (!numberOfGuests) {
//           return res.status(400).json({
//             success: false,
//             message: "numberOfGuests is required for Venues module",
//           });
//         }

//         serviceProvider = await Venue.findById(venueId).lean();
//         if (!serviceProvider) {
//           return res.status(404).json({
//             success: false,
//             message: "Venue not found",
//           });
//         }

//         pricingData = await calculateVenuePricing(
//           serviceProvider,
//           bookingDate,
//           timeSlot,
//           numberOfGuests
//         );
//         break;

//       case "Makeup":
//       case "Makeup Artist":
//         if (!makeupId) {
//           return res.status(400).json({
//             success: false,
//             message: "makeupId is required for Makeup module",
//           });
//         }

//         serviceProvider = await Makeup.findById(makeupId).lean();
//         if (!serviceProvider) {
//           return res.status(404).json({
//             success: false,
//             message: "Makeup service not found",
//           });
//         }

//         pricingData = await calculateMakeupPricing(
//           serviceProvider,
//           bookingDate,
//           timeSlot
//         );
//         break;

//       case "Photography":
//         if (!photographyId) {
//           return res.status(400).json({
//             success: false,
//             message: "photographyId is required for Photography module",
//           });
//         }
//         serviceProvider = await Photography.findById(
//           req.body.photographyId
//         ).lean();
//         if (!serviceProvider) {
//           return res.status(404).json({
//             success: false,
//             message: "Photography service not found",
//           });
//         }

//         pricingData = {
//           basePrice: Number(serviceProvider.price) || 0,
//           perDayPrice: 0,
//           perHourCharge: 0,
//           perPersonCharge: 0,
//           discount: 0,
//         };

//         break;

//       case "Catering":
//         if (!req.body.cateringId) {
//           return res.status(400).json({
//             success: false,
//             message: "cateringId is required for Catering module",
//           });
//         }

//         serviceProvider = await Catering.findById(req.body.cateringId).lean();
//         if (!serviceProvider) {
//           return res.status(404).json({
//             success: false,
//             message: "Catering service not found",
//           });
//         }

//         // Catering pricing (usually per plate × guests OR flat)
//         pricingData = {
//           basePrice: Number(serviceProvider.price) || 0,
//           perDayPrice: 0,
//           perHourCharge: 0,
//           perPersonCharge: 0,
//           discount: 0,
//         };

//         break;

//       // Add more module types as needed
//       default:
//         return res.status(400).json({
//           success: false,
//           message: `Module type "${moduleType}" is not supported yet`,
//         });
//     }

//     // -------------------------
//     // USER HANDLING
//     // -------------------------
//     let user = null;
//     let token = null;
//     let finalUserDetails = {};

//     if (bookingType === "Direct") {
//       if (!fullName || !contactNumber || !emailAddress || !address) {
//         return res.status(400).json({
//           success: false,
//           message:
//             "fullName, contactNumber, emailAddress, and address are required for Direct booking",
//         });
//       }

//       const [firstName, ...rest] = fullName.split(" ");
//       const lastName = rest.join(" ");

//       user = await User.findOne({ email: emailAddress });
//       if (!user) {
//         user = await User.create({
//           firstName,
//           lastName,
//           email: emailAddress,
//           password: "123456",
//           userId: "USR-" + Date.now(),
//         });
//       }

//       // Get auth token
//       try {
//         const resp = await axios.post(AUTH_API_URL, {
//           email: emailAddress,
//           password: "123456",
//         });
//         token = resp?.data?.token;
//       } catch (error) {
//         console.log("Auth token generation failed:", error.message);
//       }

//       finalUserDetails = { fullName, contactNumber, emailAddress, address };
//     } else if (bookingType === "Indirect") {
//       if (!userId) {
//         return res.status(400).json({
//           success: false,
//           message: "userId is required for Indirect booking",
//         });
//       }

//       user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: "User not found",
//         });
//       }

//       const profile = await Profile.findOne({ userId: user._id });

//       finalUserDetails = {
//         fullName: `${user.firstName} ${user.lastName || ""}`.trim(),
//         contactNumber: profile?.mobileNumber || "N/A",
//         emailAddress: user.email,
//         address: profile?.address || "N/A",
//       };
//     }

//     // -------------------------
//     // PACKAGE PRICING
//     // -------------------------
//     let pkg = null;
//     let packagePrice = 0;

//     if (moduleType === "Makeup" || moduleType === "Makeup Artist") {
//       // Makeup uses service provider pricing directly
//       pkg = serviceProvider;
//       packagePrice =
//         Number(pkg.finalPrice) ||
//         Number(pkg.offerPrice) ||
//         Number(pkg.basePrice) ||
//         0;
//       if (packagePrice < 0) packagePrice = 0;
//     } else if (moduleType === "Photography" || moduleType === "Catering") {
//       pkg = serviceProvider;
//       packagePrice = Number(pkg.price) || 0;
//     } else {
//       // Venues and other modules use separate package
//       if (!packageId) {
//         pkg = null;
//         packagePrice = 0;
//       } else {
//         pkg = await Package.findById(packageId).lean();

//         if (!pkg) {
//           return res.status(404).json({
//             success: false,
//             message: "Package not found",
//           });
//         }

//         if (moduleType === "Venues") {
//           packagePrice = Number(pkg.price || 0) * Number(numberOfGuests || 0);
//         } else {
//           packagePrice = Number(pkg.price || 0);
//         }
//       }
//     }
//     // -------------------------
//     // CALCULATE TOTAL PRICING
//     // -------------------------
//     let totalBeforeDiscount = 0;

//     if (
//       moduleType === "Makeup" ||
//       moduleType === "Makeup Artist" ||
//       moduleType === "Photography"
//     ) {
//       // For Makeup and Photography, only package price counts
//       totalBeforeDiscount = packagePrice;
//     } else {
//       // For Venues and others, combine base + package
//       totalBeforeDiscount = pricingData.basePrice + packagePrice;
//     }

//     const discountValue = pricingData.discount || 0;
//     let afterDiscount = totalBeforeDiscount - discountValue;
//     if (afterDiscount < 0) afterDiscount = 0;

//     // -------------------------
//     // APPLY COUPON
//     // -------------------------
//     let couponDiscountValue = 0;
//     if (couponId) {
//       const coupon = await Coupon.findById(couponId);
//       if (coupon && coupon.isActive) {
//         if (coupon.type === "percentage") {
//           couponDiscountValue = (afterDiscount * coupon.discount) / 100;
//         } else {
//           couponDiscountValue = coupon.discount;
//         }
//       }
//     }

//     const finalPrice = afterDiscount - couponDiscountValue;

//     // -------------------------
//     // ADVANCE BOOKING (Makeup Only)
//     // -------------------------
//     // let advanceAmount = 0;
//     // let remainingAmount = finalPrice;

//     // if (moduleType === "Makeup" || moduleType === "Makeup Artist") {
//     //   const makeupAdvance = Number(serviceProvider.advanceBookingAmount) || 0;

//     //   advanceAmount = makeupAdvance;
//     //   remainingAmount = finalPrice - advanceAmount;

//     //   if (remainingAmount < 0) remainingAmount = 0;
//     // }
//     // =============================
//     // UNIVERSAL ADVANCE PAYMENT LOGIC
//     // =============================
//     let advanceAmount = 0;
//     let remainingAmount = finalPrice;

//     // 1️⃣ Venues → use advanceDeposit field
//     if (moduleType === "Venues") {
//       advanceAmount = Number(serviceProvider.advanceDeposit) || 0;
//     }

//     // 2️⃣ Makeup / Makeup Artist → use advanceBookingAmount
//     else if (moduleType === "Makeup" || moduleType === "Makeup Artist") {
//       advanceAmount = Number(serviceProvider.advanceBookingAmount) || 0;
//     }

//     // 3️⃣ Other modules → use their advanceBookingAmount field
//     else {
//       advanceAmount = Number(serviceProvider.advanceBookingAmount) || 0;
//     }

//     // Prevent negative values
//     if (advanceAmount < 0) advanceAmount = 0;

//     remainingAmount = finalPrice - advanceAmount;
//     if (remainingAmount < 0) remainingAmount = 0;

//     // -------------------------
//     // CREATE BOOKING DOCUMENT
//     // -------------------------
//     const bookingData = {
//       moduleId,
//       moduleType,
//       packageId:
//         moduleType === "Makeup" || moduleType === "Makeup Artist"
//           ? null
//           : packageId,

//       providerId: serviceProvider.provider || serviceProvider?.createdBy,
//       userId: user._id,
//       bookingDate,
//       timeSlot,
//       bookingType,

//       fullName: finalUserDetails.fullName,
//       contactNumber: finalUserDetails.contactNumber,
//       emailAddress: finalUserDetails.emailAddress,
//       address: finalUserDetails.address,

//       location: serviceProvider.location,

//       perDayPrice: pricingData.perDayPrice || 0,
//       perPersonCharge: pricingData.perPersonCharge || 0,
//       perHourCharge: pricingData.perHourCharge || 0,
//       packagePrice,

//       totalBeforeDiscount,
//       discountValue,
//       discountType: discountValue > 0 ? "flat" : "none",
//       couponDiscountValue,
//       finalPrice,
//       advanceAmount,
//       remainingAmount,

//       paymentType: paymentType || null,
//     };

//     // Add module-specific fields
//    // Add module-specific fields
// if (moduleType === "Venues") {
//   bookingData.venueId = venueId;
//   bookingData.numberOfGuests = numberOfGuests;
// } else if (moduleType === "Makeup" || moduleType === "Makeup Artist") {
//   bookingData.makeupId = makeupId;
// } else if (moduleType === "Photography") {
//   bookingData.photographyId = photographyId;
// } else if (moduleType === "Catering") {
//   bookingData.cateringId = req.body.cateringId;
//   bookingData.numberOfGuests = numberOfGuests; // ✅ FIX
// }

//     const booking = await Booking.create(bookingData);

//     // Populate the booking
//     let populateFields = ["userId", "moduleId"];

//     // ⭐ KEY FIX: Only populate packageId for non-makeup modules
//     if (moduleType === "Venues") {
//       populateFields.push("venueId");
//       populateFields.push("packageId");
//     } else if (moduleType === "Makeup" || moduleType === "Makeup Artist") {
//       populateFields.push("makeupId");
//     } else if (moduleType === "Photography") {
//       populateFields.push("photographyId");

//     }
//     else if (moduleType === "Catering") {
//   populateFields.push("cateringId");
// }

//     else if (moduleType === "Catering") {
//   bookingData.cateringId = req.body.cateringId;
// }

// else {
//       // Other modules
//       if (packageId) populateFields.push("packageId");
//     }

//     const populated = await Booking.findById(booking._id)
//       .populate(populateFields)
//       .select(
//         "+paymentStatus +paymentType +status +bookingType +finalPrice +totalBeforeDiscount +discountValue +couponDiscountValue"
//       )
//       .lean();

//     // Add timeline info
//     const timeline = calculateTimeline(booking.bookingDate);

//     // ⭐ ENHANCED RESPONSE: Include makeup package details
//     return res.status(201).json({
//       success: true,
//       message: "Booking created successfully",
//       data: {
//         ...populated,
//         timeline,
//         pricing: {
//           packagePrice,
//           finalPrice,
//           advanceAmount,
//           remainingAmount,
//         },
//       },
//       token,
//     });
//   } catch (error) {
//     console.error("Create Booking Error:", error);
//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

const TIME_SLOT_MAP = {
  Morning: "9:00 AM - 1:00 PM",
  Evening: "6:00 PM - 10:00 PM",
  "Morning Section": "9:00 AM - 1:00 PM",
  "Evening Section": "6:00 PM - 10:00 PM",
};

// =======================================================
// CREATE BOOKING - COMPLETE FIX
// =======================================================

exports.createBooking = async (req, res) => {
  try {
    const {
      moduleId,
      bookingType,
      bookingDate,
      timeSlot,
      fullName,
      contactNumber,
      emailAddress,
      address,
      vehicleId,
      tripType,
      hours,
      days,
      distanceKm,
      userId,
      venueId,
      makeupId,
      photographyId,
      cateringId,
      packageId,
      numberOfGuests,
      couponId,
      paymentType,
      cakeId,
      deliveryType,
      customerMessage,
      variations,
      addons,
      decorationIncluded,
      ornamentId,
      bookingMode, // purchase | rental
    } = req.body;

    console.log("=".repeat(60));
    console.log("📥 BOOKING REQUEST RECEIVED");
    console.log("=".repeat(60));
    console.log("📌 Module Type:", moduleId);
    console.log("📌 Booking Date:", bookingDate);
    console.log("📌 Time Slot (RAW):", JSON.stringify(timeSlot));
    console.log("📌 Type of timeSlot:", typeof timeSlot);
    console.log("📌 Is Array:", Array.isArray(timeSlot));
    console.log("📌 Boutique ID:", req.body.boutiqueId);

    // BASIC VALIDATION
    if (!moduleId || !bookingDate || !bookingType) {
      return res.status(400).json({
        success: false,
        message: "moduleId, bookingDate, bookingType are required",
      });
    }

    if (!["Direct", "Indirect"].includes(bookingType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bookingType",
      });
    }

    // =======================================================
    // TIME SLOT NORMALIZATION - COMPLETE FIX
    // =======================================================

    const TIME_SLOT_MAP = {
      Morning: "9:00 AM - 1:00 PM",
      morning: "9:00 AM - 1:00 PM",
      MORNING: "9:00 AM - 1:00 PM",
      Evening: "6:00 PM - 10:00 PM",
      evening: "6:00 PM - 10:00 PM",
      EVENING: "6:00 PM - 10:00 PM",
      "Morning Section": "9:00 AM - 1:00 PM",
      "morning section": "9:00 AM - 1:00 PM",
      "MORNING SECTION": "9:00 AM - 1:00 PM",
      "Evening Section": "6:00 PM - 10:00 PM",
      "evening section": "6:00 PM - 10:00 PM",
      "EVENING SECTION": "6:00 PM - 10:00 PM",
    };

    let normalizedTimeSlot = [];

    // Handle undefined or null timeSlot
    if (!timeSlot) {
      console.log("⚠️ No timeSlot provided, using default");
      normalizedTimeSlot = [
        {
          label: "Morning",
          time: "9:00 AM - 1:00 PM",
        },
      ];
    }
    // Handle array
    else if (Array.isArray(timeSlot)) {
      console.log("🔄 Processing ARRAY timeSlot");

      normalizedTimeSlot = timeSlot.map((slot, index) => {
        console.log(`  → Processing slot[${index}]:`, JSON.stringify(slot));

        // Already formatted {label, time}
        if (slot && typeof slot === "object" && slot.label && slot.time) {
          console.log(`  ✅ Already formatted`);
          return slot;
        }

        // String slot
        if (typeof slot === "string") {
          const trimmed = slot.trim();
          const mappedTime =
            TIME_SLOT_MAP[trimmed] ||
            TIME_SLOT_MAP[trimmed.toLowerCase()] ||
            TIME_SLOT_MAP[trimmed.toUpperCase()];

          if (!mappedTime) {
            console.error(`  ❌ No mapping for: "${trimmed}"`);
            console.error(`  Available keys:`, Object.keys(TIME_SLOT_MAP));
            throw new Error(`Invalid timeSlot: "${trimmed}"`);
          }

          console.log(`  ✅ Mapped "${trimmed}" → "${mappedTime}"`);
          return {
            label: trimmed,
            time: mappedTime,
          };
        }

        throw new Error(`Invalid slot format at index ${index}`);
      });
    }
    // Handle string
    else if (typeof timeSlot === "string") {
      console.log("🔄 Processing STRING timeSlot:", timeSlot);

      const trimmed = timeSlot.trim();
      const mappedTime =
        TIME_SLOT_MAP[trimmed] ||
        TIME_SLOT_MAP[trimmed.toLowerCase()] ||
        TIME_SLOT_MAP[trimmed.toUpperCase()];

      if (!mappedTime) {
        console.error(`❌ No mapping for: "${trimmed}"`);
        console.error(`Available keys:`, Object.keys(TIME_SLOT_MAP));
        return res.status(400).json({
          success: false,
          message: `Invalid timeSlot: "${trimmed}". Use "Morning" or "Evening"`,
        });
      }

      console.log(`✅ Mapped "${trimmed}" → "${mappedTime}"`);
      normalizedTimeSlot = [
        {
          label: trimmed,
          time: mappedTime,
        },
      ];
    }
    // Handle object {label, time}
    else if (
      timeSlot &&
      typeof timeSlot === "object" &&
      timeSlot.label &&
      timeSlot.time
    ) {
      console.log("🔄 Processing OBJECT timeSlot");
      normalizedTimeSlot = [timeSlot];
    }
    // Invalid format
    else {
      console.error("❌ Invalid timeSlot format:", timeSlot);
      return res.status(400).json({
        success: false,
        message: "Invalid timeSlot format",
      });
    }

    console.log("✅ NORMALIZED TIMESLOT:", JSON.stringify(normalizedTimeSlot));
    console.log("=".repeat(60));

    // DATE NORMALIZATION
    const normalizedDate = new Date(bookingDate);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // MODULE
    const moduleData = await Module.findById(moduleId);
    if (!moduleData) {
      return res.status(400).json({
        success: false,
        message: "Invalid moduleId",
      });
    }

    const moduleType = (moduleData.title || "").trim();
    const moduleKey = moduleType.toLowerCase();

    // -------------------------------------------------------
    // 🔥 AVAILABILITY & DUPLICATE CHECK
    // -------------------------------------------------------
    const startOfDay = new Date(normalizedDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(normalizedDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const title = (moduleData.title || "").trim();
    const conflictQuery = {
      moduleId: mongoose.Types.ObjectId.isValid(moduleId)
        ? new mongoose.Types.ObjectId(moduleId)
        : moduleId,
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ["Pending", "Accepted"] }
    };


    const toId = (val) => {
      if (!val) return undefined;
      if (mongoose.Types.ObjectId.isValid(val)) {
        return new mongoose.Types.ObjectId(val);
      }
      return undefined;
    };

    // ID MAPPING (MATCHES checkAvailabilityController)
    if (vehicleId || title === "Transport") {
      conflictQuery.vehicleId = toId(vehicleId || packageId);
    } else if (req.body.boutiqueId || title === "Boutique" || title === "Boutiques") {
      conflictQuery.boutiqueId = toId(req.body.boutiqueId || packageId);
    } else if (ornamentId || title === "Ornaments" || title === "Ornament") {
      conflictQuery.ornamentId = toId(ornamentId || packageId);
    } else if (cakeId || title === "Cake") {
      conflictQuery.cakeId = toId(cakeId || packageId);
    } else if (venueId || title === "Venues") {
      const resolvedVenueId = toId(venueId || packageId);
      if (resolvedVenueId) {
        conflictQuery.venueId = resolvedVenueId;
      }
    } else if (makeupId || title === "Makeup" || title === "Makeup Artist") {
      conflictQuery.makeupId = toId(makeupId || packageId);
    } else if (photographyId || title === "Photography") {
      conflictQuery.photographyId = toId(photographyId || packageId);
    } else if (cateringId || title === "Catering") {
      conflictQuery.cateringId = toId(cateringId || packageId);
    } else if (packageId) {
      conflictQuery.packageId = toId(packageId);
    }

    // 1. Check if SAME user already has a pending or accepted booking for this item/date
    if (userId || (bookingType === "Direct" && emailAddress)) {
      const userQuery = {
        ...conflictQuery,
        $or: [
          { userId: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : undefined },
          { emailAddress: emailAddress || undefined }
        ].filter(v => v.userId || v.emailAddress)
      };
      const userConflict = await Booking.findOne(userQuery);

      if (userConflict) {
        return res.status(400).json({
          success: false,
          message: `You already have a ${userConflict.status.toLowerCase()} booking request for this date. Please check your bookings.`,
        });
      }
    }

    // 2. Check for conflicts by OTHER users
    const acceptedConflict = await Booking.findOne({
      ...conflictQuery,
      status: "Accepted"
    });

    const pendingConflict = await Booking.findOne({
      ...conflictQuery,
      status: "Pending"
    });

    let successMessage = "Booking created successfully";
    if (acceptedConflict) {
      successMessage = "Your waitlist request has been submitted. This date is already booked, but we will notify you if it becomes available due to a cancellation or vendor confirmation.";
    } else if (pendingConflict) {
      successMessage = "Your request has been submitted. This date already has a pending request; the vendor will review all interests and confirm based on availability.";
    }

    console.log("🔥 BOOKING DEBUG:", {
      moduleTitle: moduleData.title,
      moduleType,
      moduleKey,
      ornamentId
    });
    // ===============================
    // PAYMENT TYPE NORMALIZATION (FIX)
    // ===============================
    let normalizedPaymentType = paymentType;

    if (paymentType === "COD" || paymentType === "cod") {
      normalizedPaymentType = "Cash";
    }

    // USER HANDLING
    let user;
    let token = null;
    let userDetails = {};

    if (bookingType === "Direct") {
      if (!fullName || !contactNumber || !emailAddress || !address) {
        return res.status(400).json({
          success: false,
          message: "Customer details required for Direct booking",
        });
      }

      const nameParts = fullName.trim().split(" ");

      const firstName = nameParts[0];
      const lastName =
        nameParts.length > 1 ? nameParts.slice(1).join(" ") : "NA";

      user = await User.findOne({ email: emailAddress });
      if (!user) {
        user = await User.create({
          firstName,
          lastName,
          email: emailAddress,
          password: "123456",
          userId: "USR-" + Date.now(),
        });
      }

      try {
        const resp = await axios.post(AUTH_API_URL, {
          email: emailAddress,
          password: "123456",
        });
        token = resp?.data?.token || null;
      } catch (_) { }

      userDetails = { fullName, contactNumber, emailAddress, address };
    }

    if (bookingType === "Indirect") {
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId required for Indirect booking",
        });
      }

      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const profile = await Profile.findOne({ userId: user._id });

      userDetails = {
        fullName: `${user.firstName} ${user.lastName || ""}`.trim(),
        contactNumber: profile?.mobileNumber || "N/A",
        emailAddress: user.email,
        address: profile?.address || "N/A",
      };
    }

    // SERVICE PROVIDER + PRICING
    let serviceProvider;
    let pricing = {
      basePrice: 0,
      discount: 0,
      perDayPrice: 0,
      perPersonCharge: 0,
      perHourCharge: 0,
    };
    let calculatedVariations = []; // ✅ FIX: declare in function scope

    switch (moduleType) {
      case "Cake":
        if (!cakeId) {
          return res.status(400).json({
            success: false,
            message: "cakeId is required for Cake booking",
          });
        }

        if (!Array.isArray(variations) || variations.length === 0) {
          return res.status(400).json({
            success: false,
            message: "At least one cake variation must be selected",
          });
        }

        serviceProvider = await Cake.findById(cakeId).lean();
        if (!serviceProvider) {
          return res.status(404).json({
            success: false,
            message: "Cake not found",
          });
        }

        let basePrice = 0;
        calculatedVariations = [];

        for (const selected of variations) {
          if (!selected._id) {
            return res.status(400).json({
              success: false,
              message: "Invalid variation payload",
            });
          }

          const cakeVar = serviceProvider.variations.find(
            (v) => v._id.toString() === selected._id.toString()
          );

          if (!cakeVar) {
            return res.status(400).json({
              success: false,
              message: `Invalid cake variation selected: ${selected._id}`,
            });
          }

          const qty =
            Number(selected.quantity) > 0 ? Number(selected.quantity) : 1;
          const total = cakeVar.price * qty;

          calculatedVariations.push({
            variationId: cakeVar._id,
            name: cakeVar.name,
            price: cakeVar.price,
            quantity: qty,
            totalPrice: total,
          });

          basePrice += total;
        }

        pricing.basePrice = basePrice;

        /* ✅ CALCULATE ADDON TOTAL */
        let addonTotal = 0;
        if (Array.isArray(addons)) {
          addonTotal = addons.reduce((sum, a) => sum + Number(a.price || 0), 0);
        }
        pricing.addonTotal = addonTotal;

        pricing.discount = Number(serviceProvider.priceInfo?.discount) || 0;
        break;

      case "Transport": {
        console.log("🚛 Processing Transport pricing for vehicle:", vehicleId);
        if (!vehicleId) {
          return res.status(400).json({
            success: false,
            message: "vehicleId required for Transport",
          });
        }

        serviceProvider = await Vehicle.findById(vehicleId).lean();
        if (!serviceProvider) throw new Error("Vehicle not found");

        const pricingMap = serviceProvider.pricing || {};
        const basicPkg = pricingMap.basicPackage || {};

        console.log("💰 Vehicle pricing map:", JSON.stringify(pricingMap));

        let transportPrice = Number(basicPkg.price) || 0;
        let extraCharges = 0;

        // 🚗 CALCULATE EXTRA CHARGES
        // Extra Hours
        if (hours && hours > (basicPkg.includedHours || 0)) {
          const extraHours = hours - (basicPkg.includedHours || 0);
          const hourCharge = extraHours * normalizeExtraPrice(pricingMap.extraHourPrice);
          console.log(`⏰ Extra Hours: ${extraHours}, Charge: ${hourCharge}`);
          extraCharges += hourCharge;
        }

        // Extra Kilometers
        if (distanceKm && distanceKm > (basicPkg.includedKilometers || 0)) {
          const extraKm = distanceKm - (basicPkg.includedKilometers || 0);
          const kmCharge = extraKm * normalizeExtraPrice(pricingMap.extraKmPrice);
          console.log(`🛣️ Extra KM: ${extraKm}, Charge: ${kmCharge}`);
          extraCharges += kmCharge;
        }

        // 🎯 BASE PRICE (Basic Package + Extra Charges)
        pricing.basePrice = transportPrice + extraCharges;

        // Populate legacy fields for response visibility
        pricing.perDayPrice = transportPrice;
        pricing.perHourCharge = normalizeExtraPrice(pricingMap.extraHourPrice);

        console.log("📍 Base Price calculated:", pricing.basePrice);

        // 🌸 ADD DECORATION ONLY IF USER SELECTED IT
        if (
          decorationIncluded === true &&
          pricingMap.decoration?.available
        ) {
          const decorationPrice = Number(pricingMap.decoration.price) || 0;
          pricing.basePrice += decorationPrice;
          console.log("✨ Decoration added:", decorationPrice);
        }

        // 💸 DISCOUNT
        if (pricingMap.discount) {
          const discountVal = Number(pricingMap.discount.value) || 0;
          if (pricingMap.discount.type === "percentage") {
            pricing.discount = (pricing.basePrice * discountVal) / 100;
          } else {
            pricing.discount = discountVal;
          }
          console.log("🎁 Discount applied:", pricing.discount);
        }

        break;
      }

      case "Venues":
        if (!venueId || !numberOfGuests) {
          return res.status(400).json({
            success: false,
            message: "venueId & numberOfGuests required",
          });
        }

        serviceProvider = await Venue.findById(venueId).lean();
        if (!serviceProvider) throw new Error("Venue not found");

        pricing = await calculateVenuePricing(
          serviceProvider,
          bookingDate,
          normalizedTimeSlot,
          numberOfGuests
        );
        break;

      case "Makeup":
      case "Makeup Artist":
        serviceProvider = await Makeup.findById(makeupId).lean();
        if (!serviceProvider) throw new Error("Makeup service not found");

        pricing.basePrice =
          Number(serviceProvider.finalPrice) ||
          Number(serviceProvider.offerPrice) ||
          Number(serviceProvider.basePrice) ||
          0;
        break;

      case "Photography":
        serviceProvider = await Photography.findById(photographyId).lean();
        if (!serviceProvider) throw new Error("Photography service not found");

        pricing.basePrice = Number(serviceProvider.price) || 0;
        break;

      case "Catering":
        if (!cateringId || !numberOfGuests) {
          return res.status(400).json({
            success: false,
            message: "cateringId & numberOfGuests required",
          });
        }
        serviceProvider = await Catering.findById(cateringId).lean();
        if (!serviceProvider) throw new Error("Catering service not found");

        pricing.basePrice = Number(serviceProvider.price) || 0;
        break;

      case "Ornament":
      case "Ornaments":
        console.log("💍 Processing Ornament booking...");
        if (!ornamentId) {
          return res.status(400).json({
            success: false,
            message: "ornamentId is required for Ornaments booking",
          });
        }

        serviceProvider = await Ornament.findById(ornamentId).lean();
        if (!serviceProvider) {
          return res.status(404).json({
            success: false,
            message: "Ornament not found",
          });
        }

        // Determine pricing based on booking mode
        const mode = (bookingMode || serviceProvider.availabilityMode || "purchase").toLowerCase();
        console.log("💍 Ornament Mode:", mode);

        if (mode === "rental") {
          const rental = serviceProvider.rentalPricing || {};
          const minDays = Number(rental.minimumDays) || 1;
          const requestedDays = Number(days) || 0;
          const finalRentalDays = Math.max(requestedDays, minDays);

          console.log(`💍 Rental days: Requested=${requestedDays}, Min=${minDays}, Final=${finalRentalDays}`);

          // Base rent calculation
          let baseRent = (Number(rental.pricePerDay) || 0) * finalRentalDays;

          pricing.basePrice = baseRent;
          pricing.perDayPrice = Number(rental.pricePerDay) || 0;
          pricing.securityDeposit = Number(rental.securityDeposit) || 0;
          pricing.discount = 0;
        } else {
          // Default to purchase
          const buy = serviceProvider.buyPricing || {};
          pricing.basePrice = Number(buy.totalPrice) || Number(buy.unitPrice) || 0;

          // Re-calculate discount if necessary or at least snapshot it
          if (buy.discountType === "flat") {
            pricing.discount = Number(buy.discountValue) || 0;
          } else if (buy.discountType === "percentage") {
            pricing.discount = (Number(buy.unitPrice || 0) * Number(buy.discountValue || 0)) / 100;
          } else {
            pricing.discount = 0;
          }
        }
        break;

      case "Boutique":
      case "Boutiques":
        console.log("👗 Processing Boutique booking...");
        const { boutiqueId } = req.body;
        if (!boutiqueId) {
          return res.status(400).json({
            success: false,
            message: "boutiqueId is required for Boutique booking",
          });
        }

        serviceProvider = await Boutique.findById(boutiqueId).lean();
        if (!serviceProvider) {
          return res.status(404).json({
            success: false,
            message: "Boutique item not found",
          });
        }

        const bMode = (bookingMode || serviceProvider.availabilityMode || "purchase").toLowerCase();
        console.log("👗 Boutique Mode:", bMode);

        let boutiqueBasePrice = 0;
        calculatedVariations = [];

        if (Array.isArray(variations) && variations.length > 0) {
          // Handle variations
          for (const selected of variations) {
            const boutiqueVar = serviceProvider.variations?.find(
              (v) => v._id.toString() === selected._id?.toString()
            );

            const qty = Number(selected.quantity) > 0 ? Number(selected.quantity) : 1;
            let price = 0;

            if (boutiqueVar) {
              price = bMode === "rental"
                ? (Number(serviceProvider.rentalPricing?.pricePerDay) || 0)
                : (Number(boutiqueVar.price) || Number(serviceProvider.buyPricing?.unitPrice) || 0);
            } else {
              // Fallback to base pricing if variation not found or product has no variations
              price = bMode === "rental"
                ? (Number(serviceProvider.rentalPricing?.pricePerDay) || 0)
                : (Number(serviceProvider.buyPricing?.unitPrice) || 0);
            }

            const total = price * qty;

            calculatedVariations.push({
              variationId: boutiqueVar ? boutiqueVar._id : undefined,
              name: boutiqueVar ? boutiqueVar.name : (selected.name || "Default"),
              price: price,
              quantity: qty,
              totalPrice: total,
            });
            boutiqueBasePrice += total;
          }
        } else {
          // No variations, use base pricing
          const qty = Number(req.body.quantity) > 0 ? Number(req.body.quantity) : 1;
          const price = bMode === "rental"
            ? (Number(serviceProvider.rentalPricing?.pricePerDay) || 0)
            : (Number(serviceProvider.buyPricing?.unitPrice) || 0);

          boutiqueBasePrice = price * qty;

          calculatedVariations.push({
            name: "Default",
            price: price,
            quantity: qty,
            totalPrice: boutiqueBasePrice
          });
        }

        pricing.basePrice = boutiqueBasePrice;

        if (bMode === "rental") {
          const rental = serviceProvider.rentalPricing || {};
          const minDays = Number(rental.minimumDays) || 1;
          const requestedDays = Number(days) || 1;
          const finalRentalDays = Math.max(requestedDays, minDays);

          // Base price already has sum of variations or base product
          pricing.basePrice = pricing.basePrice * finalRentalDays;

          pricing.perDayPrice = (Number(rental.pricePerDay) || 0);
          pricing.securityDeposit = Number(rental.securityDeposit) || 0;
          pricing.discount = 0;
        } else {
          const buy = serviceProvider.buyPricing || {};
          if (buy.discountType === "flat") {
            pricing.discount = Number(buy.discountValue) || 0;
          } else if (buy.discountType === "percentage") {
            pricing.discount = (pricing.basePrice * (Number(buy.discountValue) || 0)) / 100;
          } else {
            pricing.discount = 0;
          }
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unsupported module ${moduleType}`,
        });
    }

    // PACKAGE PRICING (VENUES ONLY)
    let packagePrice = 0;
    if (moduleType === "Venues" && packageId) {
      const pkg = await Package.findById(packageId).lean();
      if (!pkg) throw new Error("Package not found");

      packagePrice = Number(pkg.price || 0) * numberOfGuests;
    }

    // TOTAL CALCULATION
    let totalBeforeDiscount =
      pricing.basePrice + (moduleType === "Venues" ? packagePrice : 0) + (pricing.addonTotal || 0);

    let afterDiscount = Math.max(
      totalBeforeDiscount - (pricing.discount || 0),
      0
    );

    let couponDiscountValue = 0;
    if (couponId) {
      const coupon = await Coupon.findById(couponId);
      if (coupon?.isActive) {
        couponDiscountValue =
          coupon.type === "percentage"
            ? (afterDiscount * coupon.discount) / 100
            : coupon.discount;
      }
    }

    let finalPrice = Math.max(afterDiscount - couponDiscountValue, 0);

    // [REAL WORLD RENTAL UPGRADE] 
    // Add refundable security deposit to total finalPrice for rentals
    const securityDeposit = pricing.securityDeposit || 0;
    if (securityDeposit > 0) {
      finalPrice += securityDeposit;
    }

    // ADVANCE PAYMENT
    let advanceAmount =
      Number(
        moduleType === "Venues"
          ? serviceProvider.advanceDeposit
          : moduleType === "Cake"
            ? serviceProvider.priceInfo?.advanceBookingAmount
            : (moduleKey === "ornament" || moduleKey === "ornaments")
              ? ((bookingMode || serviceProvider.availabilityMode || "purchase").toLowerCase() === "rental"
                ? serviceProvider.rentalPricing?.advanceForBooking
                : 0)
              : (moduleType === "Boutique" || moduleType === "Boutiques")
                ? ((bookingMode || serviceProvider.availabilityMode || "purchase").toLowerCase() === "rental"
                  ? serviceProvider.rentalPricing?.advanceForBooking
                  : 0)
                : serviceProvider.advanceBookingAmount
      ) || 0;

    // [REAL WORLD RENTAL UPGRADE]
    // Initial Payment (Advance) must include the full Security Deposit
    if (securityDeposit > 0) {
      advanceAmount += securityDeposit;
    }

    advanceAmount = Math.max(advanceAmount, 0);
    const remainingAmount = Math.max(finalPrice - advanceAmount, 0);

    // CREATE BOOKING
    const bookingData = {
      moduleId,
      moduleType,
      bookingType,
      paymentType: normalizedPaymentType || null,

      providerId: serviceProvider.provider || serviceProvider.createdBy,
      userId: user._id,

      bookingDate: normalizedDate,
      timeSlot: normalizedTimeSlot,

      ...userDetails,

      // ================= CAKE =================
      ...(moduleType === "Cake" && {
        cakeId,
        cakeVariations: calculatedVariations,
        addons: addons || [],
        addonTotal: pricing.addonTotal || 0,
        deliveryType,
        customerMessage,
      }),

      // ================= TRANSPORT =================
      ...(moduleType === "Transport" && {
        vehicleId,
        transportDetails: {
          tripType,
          hours: hours || null,
          days: Number(days) > 0 ? Number(days) : 1,
          distanceKm: distanceKm || null,
          decorationIncluded: !!(
            serviceProvider.pricing?.decoration?.available &&
            decorationIncluded === true
          ),
          decorationPrice:
            serviceProvider.pricing?.decoration?.available &&
              decorationIncluded === true
              ? Number(serviceProvider.pricing.decoration.price) || 0
              : 0,
        },

        // 🔥 STORE VEHICLE PRICING SNAPSHOT (UPDATED SCHEMA)
        transportPricing: {
          basicPackage: serviceProvider.pricing?.basicPackage || {
            price: 0,
            includedKilometers: 0,
            includedHours: 0,
          },
          extraKmPrice: normalizeExtraPrice(serviceProvider.pricing?.extraKmPrice),
          extraHourPrice: normalizeExtraPrice(serviceProvider.pricing?.extraHourPrice),
          discount: serviceProvider.pricing?.discount || {
            type: "none",
            value: 0,
          },
          decoration: serviceProvider.pricing?.decoration || {
            available: false,
            price: 0,
          },
        },
      }),

      // ================= BOUTIQUE =================
      ...((moduleType === "Boutique" || moduleType === "Boutiques") && {
        boutiqueId: req.body.boutiqueId,
        boutiqueVariations: calculatedVariations,
        bookingMode: bookingMode || "purchase",
        deliveryType,
        rentalPeriod: (bookingMode === "rental") ? {
          from: req.body.rentalFrom,
          to: req.body.rentalTo
        } : undefined
      }),

      // ================= ORNAMENTS =================
      ...((moduleKey === "ornament" || moduleKey === "ornaments") && {
        ornamentId,
        bookingMode: bookingMode || "purchase",
      }),

      // ================= OTHER MODULES =================
      venueId: moduleType === "Venues" ? venueId : undefined,
      makeupId:
        (moduleType === "Makeup" || moduleType === "Makeup Artist")
          ? makeupId
          : undefined,
      photographyId: moduleType === "Photography" ? photographyId : undefined,
      cateringId: moduleType === "Catering" ? cateringId : undefined,
      boutiqueId: (moduleType === "Boutique" || moduleType === "Boutiques") ? req.body.boutiqueId : undefined,
      numberOfGuests:
        (moduleType === "Venues" || moduleType === "Catering")
          ? numberOfGuests
          : undefined,

      // ================= PRICING =================
      perDayPrice: pricing.perDayPrice || 0,
      perPersonCharge: pricing.perPersonCharge || 0,
      perHourCharge: pricing.perHourCharge || 0,
      packagePrice: packagePrice || 0,

      totalBeforeDiscount,
      discountValue: pricing.discount || 0,
      discountType: pricing.discount ? "flat" : "none",
      couponDiscountValue,

      finalPrice,
      advanceAmount,
      remainingAmount,

      securityDeposit: securityDeposit || 0,
    };

    console.log("💾 Creating booking...");
    const booking = await Booking.create(bookingData);
    console.log("✅ Booking created:", booking._id);

    return res.status(201).json({
      success: true,
      message: successMessage,
      data: booking,
      token,
    });
  } catch (error) {
    console.error("=".repeat(60));
    console.error("❌ BOOKING ERROR");
    console.error("=".repeat(60));
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=".repeat(60));

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// GET BOOKINGS BY USER ID
exports.getBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await Booking.find({ userId })
      .sort({ bookingDate: -1 })
      .populate("venueId")
      .populate("vehicleId")
      .populate({
        path: "vehicleId",
        populate: { path: "provider" },
      })

      .populate("makeupId")
      .populate("photographyId")
      .populate("cateringId") // ✅ ADD THIS

      .populate("packageId")
      .populate("moduleId")
      .populate("cakeId")
      .populate("ornamentId")
      .populate("boutiqueId")

      .select(
        "+paymentStatus +paymentType +status +bookingType +finalPrice +totalBeforeDiscount"
      )
      .lean();

    return res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error("User bookings error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("userId");
    return res.json({ success: true, bookings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("userId");

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    return res.json({ success: true, booking });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID",
      error: err.message,
    });
  }
};

// ⭐ GET BOOKINGS BY PAYMENT STATUS FOR A PROVIDER
exports.getBookingsByPaymentStatus = async (req, res) => {
  try {
    const { providerId, paymentStatus } = req.params;

    const bookings = await Booking.find({
      providerId: providerId,
      paymentStatus: { $regex: new RegExp(`^${paymentStatus}$`, "i") }, // case-insensitive
    })
      .populate("userId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings by payment status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment status bookings",
      error: error.message,
    });
  }
};

// =======================================================
// HELPER: CALCULATE VENUE PRICING
// =======================================================
async function calculateVenuePricing(
  venue,
  bookingDate,
  timeSlot,
  numberOfGuests
) {
  const bookingDay = new Date(bookingDate)
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  const slot = Array.isArray(timeSlot)
    ? timeSlot[0]?.label?.toLowerCase()
    : timeSlot?.toLowerCase();

  if (!slot) {
    throw new Error("Invalid timeSlot format in venue pricing");
  }

  const priceData = venue.pricingSchedule?.[bookingDay]?.[slot];

  if (!priceData) {
    return {
      basePrice: venue.basePrice || 0,
      perDayPrice: venue.basePrice || 0,
      perPersonCharge: 0,
      discount: venue.discount?.nonAc || 0,
    };
  }

  const perDayPrice = priceData.perDay || 0;
  const perPerson = priceData.perPerson || 0;
  const perHour = priceData.perHour || 0;

  // Additive pricing: combine base rent (perDay/perHour) and per-guest fee
  const basePrice = perDayPrice + (perHour * 1) + (perPerson * numberOfGuests);

  const discount = venue.discount?.nonAc || 0;

  return {
    basePrice,
    perDayPrice,
    perPersonCharge: perPerson * numberOfGuests,
    discount,
  };
}

// =======================================================
// HELPER: CALCULATE MAKEUP PRICING
// =======================================================
async function calculateMakeupPricing(makeup) {
  return {
    basePrice: Number(makeup.finalPrice) || Number(makeup.basePrice),
    perDayPrice: 0,
    perHourCharge: 0,
    discount: 0,
  };
}

exports.getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ status: "Pending" }, { paymentStatus: "pending" }],
    }).sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAcceptedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: "Accepted",
    }).sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCompletedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      paymentStatus: "completed",
    }).sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRejectedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: { $in: ["Rejected", "Cancelled"] },
    }).sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// =======================================================
// GET BOOKINGS BY PROVIDER
// =======================================================
exports.getBookingsByProvider = async (req, res) => {
  try {
    const providerId = req.params.providerId;
    const { type } = req.query;
    const filter = { providerId };

    if (type) {
      filter.bookingType = type; // Direct | Indirect
    }

    console.log("📌 Booking Filter:", filter);

    const bookings = await Booking.find({ providerId })
      .sort({ createdAt: -1 })
      .populate("venueId")
      .populate("vehicleId")

      .populate("makeupId")
      .populate("packageId")
      .populate("userId")
      .populate("moduleId")
      .populate("ornamentId")
      .populate("boutiqueId")
      .select(
        "+paymentStatus +paymentType +status +bookingType +finalPrice +totalBeforeDiscount +discountValue +couponDiscountValue"
      )
      .lean();

    // Add timeline info to each booking
    const bookingsWithTimeline = bookings.map((booking) => ({
      ...booking,
      timeline: calculateTimeline(booking.bookingDate),
      paymentInfo: {
        status: booking.paymentStatus,
        type: booking.paymentType,
        finalPrice: booking.finalPrice,
        totalBeforeDiscount: booking.totalBeforeDiscount,
        discountValue: booking.discountValue,
        couponDiscountValue: booking.couponDiscountValue,
      },
    }));

    res.json({
      success: true,
      count: bookingsWithTimeline.length,
      data: bookingsWithTimeline,
    });
  } catch (error) {
    console.error("Provider bookings error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// GET BOOKING BY ID
// =======================================================
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("venueId")
      .populate("vehicleId")
      .populate({
        path: "vehicleId",
        populate: {
          path: "provider", // 🔥 populate provider also
        },
      })
      .populate("makeupId")
      .populate("packageId")
      .populate("userId")
      .populate("moduleId")
      .populate("boutiqueId")
      .select(
        "+paymentStatus +paymentType +status +bookingType +finalPrice +totalBeforeDiscount +discountValue +couponDiscountValue"
      )
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Calculate timeline info
    const timeline = calculateTimeline(booking.bookingDate);

    // Add payment info summary
    const response = {
      ...booking,
      timeline,
      paymentInfo: {
        status: booking.paymentStatus,
        type: booking.paymentType,
        finalPrice: booking.finalPrice,
        totalBeforeDiscount: booking.totalBeforeDiscount,
        discountValue: booking.discountValue,
        couponDiscountValue: booking.couponDiscountValue,
        amountPaid:
          booking.paymentStatus === "Paid"
            ? booking.finalPrice
            : booking.paymentStatus === "Advance"
              ? booking.advanceAmount || 0
              : 0,
        amountDue: booking.paymentStatus === "Paid" ? 0 : booking.finalPrice,
      },
    };

    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// GET UPCOMING BOOKINGS
// =======================================================
exports.getUpcomingBookings = async (req, res) => {
  try {
    const providerId = req.params.providerId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookings = await Booking.find({
      providerId,
      bookingDate: { $gte: today },
    })
      .sort({ bookingDate: 1 })
      .populate("venueId")
      .populate("vehicleId")

      .populate("makeupId")
      .populate("packageId")
      .populate("userId")
      .populate("moduleId")
      .populate("ornamentId")
      .select("+paymentStatus +paymentType +status +bookingType +finalPrice")
      .lean();

    // Add timeline info to each booking
    const bookingsWithTimeline = bookings.map((booking) => ({
      ...booking,
      timeline: calculateTimeline(booking.bookingDate),
    }));

    // Group by payment status for easy filtering
    const summary = {
      total: bookings.length,
      byPaymentStatus: {
        paid: bookings.filter((b) => b.paymentStatus === "Paid").length,
        advance: bookings.filter((b) => b.paymentStatus === "Advance").length,
        pending: bookings.filter((b) => b.paymentStatus === "Pending").length,
      },
      byPaymentType: {
        cash: bookings.filter((b) => b.paymentType === "Cash").length,
        card: bookings.filter((b) => b.paymentType === "Card").length,
        upi: bookings.filter((b) =>
          ["UPI", "GPay", "PhonePe", "Paytm"].includes(b.paymentType)
        ).length,
        bank: bookings.filter((b) =>
          ["Bank Transfer", "Net Banking"].includes(b.paymentType)
        ).length,
        other: bookings.filter((b) => b.paymentType === "Other").length,
        pending: bookings.filter((b) => !b.paymentType).length,
      },
      byTimeline: {
        today: bookingsWithTimeline.filter((b) => b.timeline.isToday).length,
        upcoming: bookingsWithTimeline.filter(
          (b) => b.timeline.isUpcoming && !b.timeline.isToday
        ).length,
      },
    };

    res.json({
      success: true,
      summary,
      data: bookingsWithTimeline,
    });
  } catch (error) {
    console.error("Upcoming booking error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// GET PAST BOOKINGS
// =======================================================
exports.getPastBookings = async (req, res) => {
  try {
    const providerId = req.params.providerId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookings = await Booking.find({
      providerId,
      bookingDate: { $lt: today },
    })
      .sort({ bookingDate: -1 })
      .populate("venueId")
      .populate("vehicleId")

      .populate("makeupId")
      .populate("packageId")
      .populate("userId")
      .populate("moduleId")
      .populate("ornamentId")
      .select("+paymentStatus +paymentType +status +bookingType +finalPrice")
      .lean();

    // Add timeline info to each booking
    const bookingsWithTimeline = bookings.map((booking) => ({
      ...booking,
      timeline: calculateTimeline(booking.bookingDate),
    }));

    // Group by payment status
    const summary = {
      total: bookings.length,
      byPaymentStatus: {
        paid: bookings.filter((b) => b.paymentStatus === "Paid").length,
        advance: bookings.filter((b) => b.paymentStatus === "Advance").length,
        pending: bookings.filter((b) => b.paymentStatus === "Pending").length,
      },
      byPaymentType: {
        cash: bookings.filter((b) => b.paymentType === "Cash").length,
        card: bookings.filter((b) => b.paymentType === "Card").length,
        upi: bookings.filter((b) =>
          ["UPI", "GPay", "PhonePe", "Paytm"].includes(b.paymentType)
        ).length,
        bank: bookings.filter((b) =>
          ["Bank Transfer", "Net Banking"].includes(b.paymentType)
        ).length,
        other: bookings.filter((b) => b.paymentType === "Other").length,
        pending: bookings.filter((b) => !b.paymentType).length,
      },
    };

    res.json({
      success: true,
      summary,
      data: bookingsWithTimeline,
    });
  } catch (error) {
    console.error("Past booking error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// ACCEPT BOOKING
// =======================================================
exports.acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.status = "Accepted";
    await booking.save();

    const timeline = calculateTimeline(booking.bookingDate);

    res.json({
      success: true,
      message: "Booking accepted",
      data: {
        ...booking.toObject(),
        timeline,
      },
    });
  } catch (error) {
    console.error("Accept error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// REJECT BOOKING
// =======================================================
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.status = "Rejected";
    await booking.save();

    const timeline = calculateTimeline(booking.bookingDate);

    res.json({
      success: true,
      message: "Booking rejected",
      data: {
        ...booking.toObject(),
        timeline,
      },
    });
  } catch (error) {
    console.error("Reject error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// UPDATE PAYMENT STATUS
// =======================================================
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus, paymentType } = req.body;

    if (!["Advance", "Pending", "Paid"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status. Must be: Advance, Pending, or Paid",
      });
    }

    // Validate payment type if provided
    const validPaymentTypes = [
      "Cash",
      "Card",
      "UPI",
      "GPay",
      "PhonePe",
      "Paytm",
      "Bank Transfer",
      "Net Banking",
      "Other",
    ];
    if (paymentType && !validPaymentTypes.includes(paymentType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment type. Must be one of: ${validPaymentTypes.join(
          ", "
        )}`,
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.paymentStatus = paymentStatus;
    if (paymentType) {
      booking.paymentType = paymentType;
    }
    await booking.save();

    const timeline = calculateTimeline(booking.bookingDate);

    res.json({
      success: true,
      message: "Payment information updated",
      data: {
        ...booking.toObject(),
        timeline,
        paymentInfo: {
          status: booking.paymentStatus,
          type: booking.paymentType,
          finalPrice: booking.finalPrice,
          amountPaid:
            paymentStatus === "Paid"
              ? booking.finalPrice
              : paymentStatus === "Advance"
                ? booking.advanceAmount || 0
                : 0,
          amountDue: paymentStatus === "Paid" ? 0 : booking.finalPrice,
        },
      },
    });
  } catch (error) {
    console.error("Payment update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// ADD CHAT CONVERSATION
// =======================================================
exports.addChatConversation = async (req, res) => {
  try {
    const { conversationId } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.conversationId = conversationId;
    await booking.save();

    const timeline = calculateTimeline(booking.bookingDate);

    res.json({
      success: true,
      message: "Chat conversation updated",
      data: {
        ...booking.toObject(),
        timeline,
      },
    });
  } catch (error) {
    console.error("Chat update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// GET BOOKINGS BY PAYMENT STATUS
// =======================================================
exports.getBookingsByPaymentStatus = async (req, res) => {
  try {
    const { providerId, paymentStatus } = req.params;

    if (!["Advance", "Pending", "Paid"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status. Must be: Advance, Pending, or Paid",
      });
    }

    const bookings = await Booking.find({
      providerId,
      paymentStatus,
    })
      .sort({ bookingDate: -1 })
      .populate("venueId")
      .populate("vehicleId")

      .populate("makeupId")
      .populate("packageId")
      .populate("userId")
      .populate("moduleId")
      .select(
        "+paymentStatus +paymentType +status +bookingType +finalPrice +totalBeforeDiscount"
      )
      .lean();

    // Add timeline info to each booking
    const bookingsWithTimeline = bookings.map((booking) => ({
      ...booking,
      timeline: calculateTimeline(booking.bookingDate),
    }));

    // Calculate totals and group by payment type
    const totalAmount = bookings.reduce(
      (sum, b) => sum + (b.finalPrice || 0),
      0
    );

    const paymentTypeSummary = {
      cash: bookings
        .filter((b) => b.paymentType === "Cash")
        .reduce((sum, b) => sum + (b.finalPrice || 0), 0),
      card: bookings
        .filter((b) => b.paymentType === "Card")
        .reduce((sum, b) => sum + (b.finalPrice || 0), 0),
      upi: bookings
        .filter((b) =>
          ["UPI", "GPay", "PhonePe", "Paytm"].includes(b.paymentType)
        )
        .reduce((sum, b) => sum + (b.finalPrice || 0), 0),
      bank: bookings
        .filter((b) => ["Bank Transfer", "Net Banking"].includes(b.paymentType))
        .reduce((sum, b) => sum + (b.finalPrice || 0), 0),
      other: bookings
        .filter((b) => b.paymentType === "Other")
        .reduce((sum, b) => sum + (b.finalPrice || 0), 0),
    };

    res.json({
      success: true,
      paymentStatus,
      count: bookingsWithTimeline.length,
      totalAmount,
      paymentTypeSummary,
      data: bookingsWithTimeline,
    });
  } catch (error) {
    console.error("Payment status filter error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// CANCEL BOOKING (SOFT DELETE)
// =======================================================
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, cancellationReason } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required to cancel booking",
      });
    }

    // Find the booking
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Authorization: Check if user owns this booking
    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to cancel this booking",
      });
    }

    // Validate booking status - can only cancel Pending or Accepted bookings
    if (!["Pending", "Accepted"].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel booking with status: ${booking.status}. Only Pending or Accepted bookings can be cancelled.`,
      });
    }

    // Check if already cancelled
    if (booking.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "This booking is already cancelled",
      });
    }

    // Update booking to cancelled status
    booking.status = "Cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason = cancellationReason || "No reason provided";

    // Set refund status based on payment status
    if (booking.paymentStatus === "completed" || booking.paidAmount > 0) {
      booking.refundStatus = "pending";
    } else {
      booking.refundStatus = "not_applicable";
    }

    await booking.save();

    // Populate booking details for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate("userId", "firstName lastName email")
      .populate("moduleId", "title")
      .lean();

    // Add timeline info
    const timeline = calculateTimeline(booking.bookingDate);

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        ...populatedBooking,
        timeline,
      },
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================================================
// DELETE BOOKING
// =======================================================
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Optional: Add permission check
    // Only allow deletion of Direct bookings or by the provider
    if (booking.bookingType === "Indirect") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete indirect bookings",
      });
    }

    await Booking.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =======================================================
// CHECK BOOKING TIMELINE STATUS
// =======================================================
exports.checkBookingTimeline = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .select("bookingDate")
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const timeline = calculateTimeline(booking.bookingDate);

    res.json({
      success: true,
      data: {
        bookingId: booking._id,
        bookingDate: booking.bookingDate,
        timeline,
      },
    });
  } catch (error) {
    console.error("Timeline check error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
