// const axios = require("axios");
// const Booking = require("../../models/vendor/Booking");
// const User = require("../../models/User");
// const Venue = require("../../models/vendor/Venue");
// const Package = require("../../models/admin/Package");
// const Profile = require("../../models/vendor/Profile");
// const Coupon = require("../../models/admin/coupons");

// const AUTH_API_URL = "https://api.bookmyevent.ae/api/auth/login";

// // ========================================================
// // 🔹 CREATE BOOKING (Direct + Indirect)
// // ========================================================
// exports.createBooking = async (req, res) => {
//   try {
//     const {
//       venueId,
//       packageId,
//       couponId, // ✅ new field
//       fullName,
//       contactNumber,
//       emailAddress,
//       address,
//       numberOfGuests,
//       bookingDate,
//       timeSlot,
//       bookingType,
//       userId,
//     } = req.body;

//     if (!venueId || !packageId || !bookingDate || !timeSlot || !bookingType) {
//       return res.status(400).json({ message: "All required fields are missing" });
//     }

//     const venue = await Venue.findById(venueId).lean();
//     if (!venue) return res.status(404).json({ message: "Venue not found" });

//     const providerId = venue.provider?._id || venue.providerId || null;
//     let user = null;
//     let token = null;
//     let bookingUserDetails = {};

//     // ------------------- DIRECT BOOKING -------------------
//     if (bookingType === "Direct") {
//       if (!emailAddress || !fullName || !contactNumber || !address) {
//         return res.status(400).json({
//           message: "Full name, contact number, email, and address are required for Direct booking",
//         });
//       }

//       const nameParts = fullName.trim().split(" ");
//       const firstName = nameParts[0] || "";
//       const lastName = nameParts.slice(1).join(" ") || "";

//       user = await User.findOne({ email: emailAddress });
//       if (!user) {
//         user = new User({
//           firstName,
//           lastName,
//           email: emailAddress,
//           password: "123456",
//           userId: "USR-" + Date.now(),
//         });
//         await user.save();
//       }

//       const { data } = await axios.post(AUTH_API_URL, {
//         email: emailAddress,
//         password: "123456",
//       });
//       token = data?.token || null;

//       bookingUserDetails = { fullName, contactNumber, emailAddress, address };
//     }

//     // ------------------- INDIRECT BOOKING -------------------
//     if (bookingType === "Indirect") {
//       if (!userId) return res.status(400).json({ message: "userId is required for Indirect booking" });

//       user = await User.findById(userId);
//       if (!user) return res.status(404).json({ message: "User not found with given userId" });

//       const profile = await Profile.findOne({ userId: user._id });

//       bookingUserDetails = {
//         fullName: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim(),
//         contactNumber: profile?.mobileNumber || "N/A",
//         emailAddress: user.email,
//         address: profile?.address || "N/A",
//       };
//     }

//     // ------------------- PRICE CALCULATION -------------------
//     const packageData = await Package.findById(packageId).lean();
//     if (!packageData) return res.status(404).json({ message: "Package not found" });

//     const bookingDay = new Date(bookingDate)
//       .toLocaleDateString("en-US", { weekday: "long" })
//       .toLowerCase();

//     const slotKey = Array.isArray(timeSlot) ? timeSlot[0].toLowerCase() : timeSlot.toLowerCase();
//     const dayPricing = venue.pricingSchedule?.[bookingDay]?.[slotKey];
//     if (!dayPricing)
//       return res.status(400).json({ message: `No pricing available for ${bookingDay} ${timeSlot}` });

//     const perDayPrice = dayPricing.perDay || 0;
//     const perPerson = dayPricing.perPerson || 0;
//     const perHourCharge = dayPricing.perHour || 0;

//     const packagePrice = (packageData.price || 0) * (numberOfGuests || 0);

//     let totalBeforeDiscount = 0;
//     if (perDayPrice > 0) {
//       totalBeforeDiscount = perDayPrice + packagePrice;
//     } else if (perPerson > 0) {
//       totalBeforeDiscount = perPerson * numberOfGuests + packagePrice;
//     } else {
//       totalBeforeDiscount = packagePrice;
//     }

//     // ✅ Venue Discount
//     const flatDiscount = venue.discount?.nonAc || 0;
//     const discountValue = flatDiscount > totalBeforeDiscount ? totalBeforeDiscount : flatDiscount;
//     const discountType = flatDiscount > 0 ? "flat" : "none";
//     let afterVenueDiscount = Math.max(totalBeforeDiscount - discountValue, 0);

//     // ✅ Coupon Discount
//     let couponDiscountValue = 0;
//     if (couponId) {
//       const coupon = await Coupon.findById(couponId);
//       const now = new Date();

//       if (
//         coupon &&
//         coupon.isActive &&
//         new Date(coupon.startDate) <= now &&
//         new Date(coupon.expireDate) >= now &&
//         coupon.usedCount < coupon.totalUses
//       ) {
//         if (coupon.type === "percentage" && coupon.discount > 0) {
//           couponDiscountValue = (afterVenueDiscount * coupon.discount) / 100;
//         } else if (coupon.type === "flat" && coupon.discount > 0) {
//           couponDiscountValue = coupon.discount;
//         }

//         // Ensure discount doesn’t exceed total
//         if (couponDiscountValue > afterVenueDiscount) {
//           couponDiscountValue = afterVenueDiscount;
//         }

//         // Optionally increase used count
//         await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
//       }
//     }

//     const finalPrice = Math.max(afterVenueDiscount - couponDiscountValue, 0);

//     // ------------------- CREATE BOOKING -------------------
//     const bookingData = {
//       providerId,
//       userId: user?._id || null,
//       venueId,
//       packageId,
//       couponId: couponId || null,
//       numberOfGuests,
//       bookingDate,
//       timeSlot: [timeSlot],
//       bookingType,
//       status: "Pending",
//       fullName: bookingUserDetails.fullName,
//       contactNumber: bookingUserDetails.contactNumber,
//       emailAddress: bookingUserDetails.emailAddress,
//       address: bookingUserDetails.address,
//       perDayPrice,
//       perPersonCharge: perPerson * (numberOfGuests || 0),
//       perHourCharge,
//       packagePrice,
//       totalBeforeDiscount,
//       discountValue,
//       discountType,
//       couponDiscountValue,
//       finalPrice,
//     };

//     const booking = await Booking.create(bookingData);

//     let populatedBooking = await Booking.findById(booking._id)
//       .populate("venueId")
//       .populate("packageId")
//       .populate("couponId")
//       .populate("userId", "firstName lastName email userId");

//     if (populatedBooking.userId) {
//       const u = populatedBooking.userId;
//       populatedBooking = populatedBooking.toObject();
//       populatedBooking.userId = {
//         _id: u._id,
//         userId: u.userId,
//         fullName: `${u.firstName}${u.lastName ? " " + u.lastName : ""}`.trim(),
//         email: u.email,
//         id: u._id,
//       };
//     }

//     res.status(201).json({
//       success: true,
//       message: "Booking created successfully with coupon applied",
//       data: populatedBooking,
//       token: token || null,
//     });
//   } catch (error) {
//     console.error("Booking creation error:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };
// // ========================================================
// // 🔹 GET BOOKING BY ID
// // ========================================================
// exports.getBookingById = async (req, res) => {
//   try {
//     let booking = await Booking.findById(req.params.id)
//       .populate({
//         path: "venueId",
//         model: "Venue",
//         populate: {
//           path: "categories.module",
//           model: "Module",
//         },
//       })
//       .populate({
//         path: "packageId",
//         model: "Package",
//         populate: {
//           path: "categories",
//           model: "Category",
//         },
//       })
//       .populate("userId", "firstName lastName email userId");

//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     // ✅ Format user object
//     if (booking.userId) {
//       const u = booking.userId;
//       booking = booking.toObject();
//       booking.userId = {
//         _id: u._id,
//         userId: u.userId,
//         fullName: `${u.firstName}${u.lastName ? " " + u.lastName : ""}`.trim(),
//         email: u.email,
//         id: u._id,
//       };
//     }

//     res.status(200).json({ success: true, data: booking });
//   } catch (error) {
//     console.error("Get booking error:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// // ========================================================
// // 🔹 GET BOOKINGS BY USER
// // ========================================================
// exports.getBookingsByUser = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     let bookings = await Booking.find({ userId })
//       .populate({
//         path: "venueId",
//         model: "Venue",
//         populate: {
//           path: "categories.module",
//           model: "Module",
//         },
//       })
//       .populate({
//         path: "packageId",
//         model: "Package",
//         populate: {
//           path: "categories",
//           model: "Category",
//         },
//       })
//       .populate("userId", "firstName lastName email userId");

//     if (!bookings.length)
//       return res.status(404).json({ message: "No bookings found" });

//     // ✅ Format all user objects
//     bookings = bookings.map((b) => {
//       if (b.userId) {
//         const u = b.userId;
//         const formatted = b.toObject();
//         formatted.userId = {
//           _id: u._id,
//           userId: u.userId,
//           fullName: `${u.firstName}${
//             u.lastName ? " " + u.lastName : ""
//           }`.trim(),
//           email: u.email,
//           id: u._id,
//         };
//         return formatted;
//       }
//       return b;
//     });

//     res.status(200).json({ success: true, data: bookings });
//   } catch (error) {
//     console.error("Get bookings by user error:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };

// // ========================================================
// // 🔹 GET BOOKINGS BY PROVIDER
// // ========================================================
// exports.getBookingsByProvider = async (req, res) => {
//   try {
//     const { providerId } = req.params;

//     let bookings = await Booking.find({ providerId })
//       .populate({
//         path: "venueId",
//         model: "Venue",
//         populate: {
//           path: "categories.module",
//           model: "Module",
//         },
//       })
//       .populate({
//         path: "packageId",
//         model: "Package",
//         populate: {
//           path: "categories",
//           model: "Category",
//         },
//       })
//       .populate("userId", "firstName lastName email userId");

//     if (!bookings.length)
//       return res.status(404).json({ message: "No bookings found" });

//     // ✅ Format all user objects
//     bookings = bookings.map((b) => {
//       if (b.userId) {
//         const u = b.userId;
//         const formatted = b.toObject();
//         formatted.userId = {
//           _id: u._id,
//           userId: u.userId,
//           fullName: `${u.firstName}${
//             u.lastName ? " " + u.lastName : ""
//           }`.trim(),
//           email: u.email,
//           id: u._id,
//         };
//         return formatted;
//       }
//       return b;
//     });

//     res.status(200).json({ success: true, data: bookings });
//   } catch (error) {
//     console.error("Get bookings by provider error:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// };












// controllers/vendor/unifiedBookingController.js
// controllers/vendor/unifiedBookingController.js
// controllers/vendor/unifiedBookingController.js
// const axios = require("axios");
// const Booking = require("../../models/vendor/Booking");
// const User = require("../../models/User");
// const Venue = require("../../models/vendor/Venue");
// const Makeup = require("../../models/admin/makeupPackageModel"); // Add your Makeup model
// const Package = require("../../models/admin/Package");
// const Profile = require("../../models/vendor/Profile");
// const Coupon = require("../../models/admin/coupons");
// const Module = require("../../models/admin/module");

// const AUTH_API_URL = "https://api.bookmyevent.ae/api/auth/login";

// // =======================================================
// // CREATE UNIFIED BOOKING (SUPPORTS MULTIPLE MODULES)
// // =======================================================
// exports.createBooking = async (req, res) => {
//   try {
//     const {
//       moduleId,
//       venueId,
//       makeupId,
//       packageId,
//       numberOfGuests,
//       bookingDate,
//       timeSlot,
//       bookingType,
//       userId,
//       couponId,
//       fullName,
//       contactNumber,
//       emailAddress,
//       address
//     } = req.body;

//     // Validate common required fields
//     if (!moduleId || !packageId || !bookingDate || !timeSlot) {
//       return res.status(400).json({
//         success: false,
//         message: "moduleId, packageId, bookingDate, and timeSlot are required"
//       });
//     }

//     // Validate MongoDB ObjectId format
//     const mongoose = require('mongoose');
//     if (!mongoose.Types.ObjectId.isValid(moduleId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid moduleId format"
//       });
//     }
//     if (!mongoose.Types.ObjectId.isValid(packageId)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid packageId format"
//       });
//     }

//     // Get module information
//     const moduleData = await Module.findById(moduleId);
//     if (!moduleData) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid moduleId" 
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
//             message: "venueId is required for Venues module" 
//           });
//         }
//         if (!numberOfGuests) {
//           return res.status(400).json({ 
//             success: false, 
//             message: "numberOfGuests is required for Venues module" 
//           });
//         }

//         serviceProvider = await Venue.findById(venueId).lean();
//         if (!serviceProvider) {
//           return res.status(404).json({ 
//             success: false, 
//             message: "Venue not found" 
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
//         if (!makeupId) {
//           return res.status(400).json({ 
//             success: false, 
//             message: "makeupId is required for Makeup module" 
//           });
//         }

//         serviceProvider = await Makeup.findById(makeupId).lean();
//         if (!serviceProvider) {
//           return res.status(404).json({ 
//             success: false, 
//             message: "Makeup service not found" 
//           });
//         }

//         pricingData = await calculateMakeupPricing(
//           serviceProvider, 
//           bookingDate, 
//           timeSlot
//         );
//         break;

//       // Add more module types as needed
//       default:
//         return res.status(400).json({
//           success: false,
//           message: `Module type "${moduleType}" is not supported yet`
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
//           message: "fullName, contactNumber, emailAddress, and address are required for Direct booking"
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
//           userId: "USR-" + Date.now()
//         });
//       }

//       // Get auth token
//       try {
//         const resp = await axios.post(AUTH_API_URL, { 
//           email: emailAddress, 
//           password: "123456" 
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
//           message: "userId is required for Indirect booking" 
//         });
//       }

//       user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({ 
//           success: false, 
//           message: "User not found" 
//         });
//       }

//       const profile = await Profile.findOne({ userId: user._id });

//       finalUserDetails = {
//         fullName: `${user.firstName} ${user.lastName || ""}`.trim(),
//         contactNumber: profile?.mobileNumber || "N/A",
//         emailAddress: user.email,
//         address: profile?.address || "N/A"
//       };
//     }

//     // -------------------------
//     // PACKAGE PRICING
//     // -------------------------
//     let pkg = null;
//     let packagePrice = 0;

//     if (moduleType === "Makeup") {
//       // For makeup, the package IS the makeup service itself
//       pkg = serviceProvider; // The makeup object already has basePrice, finalPrice, etc.
//       packagePrice = pkg.finalPrice || pkg.basePrice || 0;
//     } else {
//       // For other modules (Venues, etc.), use the Package model
//       pkg = await Package.findById(packageId).lean();
//       if (!pkg) {
//         return res.status(404).json({ 
//           success: false, 
//           message: `Package not found with ID: ${packageId}` 
//         });
//       }
//       packagePrice = moduleType === "Venues" 
//         ? pkg.price * numberOfGuests 
//         : pkg.price;
//     }

//     // -------------------------
//     // CALCULATE TOTAL PRICING
//     // -------------------------
//     let totalBeforeDiscount = pricingData.basePrice + packagePrice;

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
//     // CREATE BOOKING DOCUMENT
//     // -------------------------
//     const bookingData = {
//       moduleId,
//       moduleType,
//       packageId,
//       providerId: serviceProvider.provider,
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
//       finalPrice
//     };

//     // Add module-specific fields
//     if (moduleType === "Venues") {
//       bookingData.venueId = venueId;
//       bookingData.numberOfGuests = numberOfGuests;
//     } else if (moduleType === "Makeup") {
//       bookingData.makeupId = makeupId;
//     }

//     const booking = await Booking.create(bookingData);

//     // Populate the booking
//     let populateFields = ["packageId", "userId"];
//     if (moduleType === "Venues") populateFields.push("venueId");
//     if (moduleType === "Makeup") populateFields.push("makeupId");

//     const populated = await Booking.findById(booking._id)
//       .populate(populateFields)
//       .lean();

//     return res.status(201).json({
//       success: true,
//       message: "Booking created successfully",
//       data: populated,
//       token
//     });

//   } catch (error) {
//     console.error("Create Booking Error:", error);
//     res.status(500).json({ 
//       success: false, 
//       message: error.message 
//     });
//   }
// };

// // =======================================================
// // HELPER: CALCULATE VENUE PRICING
// // =======================================================
// async function calculateVenuePricing(venue, bookingDate, timeSlot, numberOfGuests) {
//   const bookingDay = new Date(bookingDate)
//     .toLocaleDateString("en-US", { weekday: "long" })
//     .toLowerCase();

//   const slot = timeSlot.toLowerCase();

//   const priceData = venue.pricingSchedule?.[bookingDay]?.[slot];
//   if (!priceData) {
//     throw new Error(`No pricing found for ${bookingDay} - ${slot}`);
//   }

//   const perDayPrice = priceData.perDay || 0;
//   const perPerson = priceData.perPerson || 0;

//   const basePrice = perDayPrice > 0 
//     ? perDayPrice 
//     : perPerson * numberOfGuests;

//   const discount = venue.discount?.nonAc || 0;

//   return {
//     basePrice,
//     perDayPrice,
//     perPersonCharge: perPerson * numberOfGuests,
//     discount
//   };
// }

// // =======================================================
// // HELPER: CALCULATE MAKEUP PRICING
// // =======================================================
// async function calculateMakeupPricing(makeup, bookingDate, timeSlot) {
//   // For makeup, no separate pricing - only package price will be used
//   return {
//     basePrice: 0,
//     perDayPrice: 0,
//     perHourCharge: 0,
//     discount: 0
//   };
// }

// // =======================================================
// // GET BOOKINGS BY PROVIDER
// // =======================================================
// exports.getBookingsByProvider = async (req, res) => {
//   try {
//     const providerId = req.params.providerId;

//     const bookings = await Booking.find({ providerId })
//       .sort({ bookingDate: 1 })
//       .populate("venueId")
//       .populate("makeupId")
//       .populate("packageId")
//       .populate("userId");

//     res.json({ success: true, data: bookings });

//   } catch (error) {
//     console.error("Provider bookings error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // =======================================================
// // GET BOOKING BY ID
// // =======================================================
// exports.getBookingById = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.id)
//       .populate("venueId")
//       .populate("makeupId")
//       .populate("packageId")
//       .populate("userId")
//       .populate("moduleId");

//     if (!booking) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Booking not found" 
//       });
//     }

//     res.json({ success: true, data: booking });

//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // =======================================================
// // GET UPCOMING BOOKINGS
// // =======================================================
// exports.getUpcomingBookings = async (req, res) => {
//   try {
//     const providerId = req.params.providerId;

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const bookings = await Booking.find({
//       providerId,
//       bookingDate: { $gte: today }
//     })
//       .sort({ bookingDate: 1 })
//       .populate("venueId")
//       .populate("makeupId")
//       .populate("packageId")
//       .populate("userId");

//     res.json({ success: true, data: bookings });

//   } catch (error) {
//     console.error("Upcoming booking error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // =======================================================
// // GET PAST BOOKINGS
// // =======================================================
// exports.getPastBookings = async (req, res) => {
//   try {
//     const providerId = req.params.providerId;

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const bookings = await Booking.find({
//       providerId,
//       bookingDate: { $lt: today }
//     })
//       .sort({ bookingDate: -1 })
//       .populate("venueId")
//       .populate("makeupId")
//       .populate("packageId")
//       .populate("userId");

//     res.json({ success: true, data: bookings });

//   } catch (error) {
//     console.error("Past booking error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // =======================================================
// // ACCEPT BOOKING
// // =======================================================
// exports.acceptBooking = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.id);
    
//     if (!booking) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Booking not found" 
//       });
//     }

//     booking.status = "Accepted";
//     await booking.save();

//     res.json({ 
//       success: true, 
//       message: "Booking accepted", 
//       data: booking 
//     });

//   } catch (error) {
//     console.error("Accept error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // =======================================================
// // REJECT BOOKING
// // =======================================================
// exports.rejectBooking = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.id);
    
//     if (!booking) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Booking not found" 
//       });
//     }

//     booking.status = "Rejected";
//     await booking.save();

//     res.json({ 
//       success: true, 
//       message: "Booking rejected", 
//       data: booking 
//     });

//   } catch (error) {
//     console.error("Reject error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // =======================================================
// // UPDATE PAYMENT STATUS
// // =======================================================
// exports.updatePaymentStatus = async (req, res) => {
//   try {
//     const { paymentStatus } = req.body;
    
//     if (!["Advance", "Pending", "Paid"].includes(paymentStatus)) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "Invalid payment status" 
//       });
//     }

//     const booking = await Booking.findById(req.params.id);
    
//     if (!booking) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Booking not found" 
//       });
//     }

//     booking.paymentStatus = paymentStatus;
//     await booking.save();

//     res.json({ 
//       success: true, 
//       message: "Payment status updated", 
//       data: booking 
//     });

//   } catch (error) {
//     console.error("Payment update error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // =======================================================
// // ADD CHAT CONVERSATION
// // =======================================================
// exports.addChatConversation = async (req, res) => {
//   try {
//     const { conversationId } = req.body;

//     const booking = await Booking.findById(req.params.id);
    
//     if (!booking) {
//       return res.status(404).json({ 
//         success: false, 
//         message: "Booking not found" 
//       });
//     }

//     booking.conversationId = conversationId;
//     await booking.save();

//     res.json({ 
//       success: true, 
//       message: "Chat conversation updated", 
//       data: booking 
//     });

//   } catch (error) {
//     console.error("Chat update error:", error);
//     res.status(500).json({ success: false, message: error.message });
//   }
// };



// controllers/vendor/unifiedBookingController.js
// controllers/vendor/unifiedBookingController.js
// controllers/vendor/unifiedBookingController.js
const axios = require("axios");
const Booking = require("../../models/vendor/Booking");
const User = require("../../models/User");
const Venue = require("../../models/vendor/Venue");
const Makeup = require("../../models/admin/makeupPackageModel");
const Package = require("../../models/admin/Package");
const Profile = require("../../models/vendor/Profile");
const Coupon = require("../../models/admin/coupons");
const Module = require("../../models/admin/module");

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

  const daysDifference = Math.ceil((bookingDateOnly - today) / (1000 * 60 * 60 * 24));

  return {
    status: isToday ? "Today" : (isUpcoming ? "Upcoming" : "Past"),
    isUpcoming,
    isPast,
    isToday,
    daysUntil: isUpcoming && !isToday ? daysDifference : null,
    daysAgo: isPast ? Math.abs(daysDifference) : null,
    message: isToday 
      ? "This booking is scheduled for TODAY!" 
      : isUpcoming 
      ? `This booking is ${daysDifference} day(s) away` 
      : `This booking was ${Math.abs(daysDifference)} day(s) ago`
  };
}

// =======================================================
// CREATE BOOKING (UNIFIED FOR ALL MODULES)
// =======================================================
exports.createBooking = async (req, res) => {
  try {
    const {
      moduleId,
      venueId,
      makeupId,
      packageId,
      numberOfGuests,
      bookingDate,
      timeSlot,
      bookingType,
      userId,
      couponId,
      fullName,
      contactNumber,
      emailAddress,
      address,
      paymentType // NEW: Payment method
    } = req.body;

    // Validate common required fields
    // if (!moduleId  || !bookingDate ) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "moduleId, packageId, bookingDate, and timeSlot are required"
    //   });
    // }
    if (!moduleId || !bookingDate) {
  return res.status(400).json({
    success: false,
    message: "moduleId and bookingDate are required"
  });
}


    // Validate MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(moduleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid moduleId format"
      });
    }
    // if (!mongoose.Types.ObjectId.isValid(packageId)) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Invalid packageId format"
    //   });
    // }

    // Get module information
    const moduleData = await Module.findById(moduleId);
    if (!moduleData) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid moduleId" 
      });
    }

    const moduleType = moduleData.title; // e.g., "Venues", "Makeup", etc.

    // Module-specific validation and data fetching
    let serviceProvider = null;
    let pricingData = null;

    switch (moduleType) {
      case "Venues":
        if (!venueId) {
          return res.status(400).json({ 
            success: false, 
            message: "venueId is required for Venues module" 
          });
        }
        if (!numberOfGuests) {
          return res.status(400).json({ 
            success: false, 
            message: "numberOfGuests is required for Venues module" 
          });
        }

        serviceProvider = await Venue.findById(venueId).lean();
        if (!serviceProvider) {
          return res.status(404).json({ 
            success: false, 
            message: "Venue not found" 
          });
        }

        pricingData = await calculateVenuePricing(
          serviceProvider, 
          bookingDate, 
          timeSlot, 
          numberOfGuests
        );
        break;

      case "Makeup":
        if (!makeupId) {
          return res.status(400).json({ 
            success: false, 
            message: "makeupId is required for Makeup module" 
          });
        }

        serviceProvider = await Makeup.findById(makeupId).lean();
        if (!serviceProvider) {
          return res.status(404).json({ 
            success: false, 
            message: "Makeup service not found" 
          });
        }

        pricingData = await calculateMakeupPricing(
          serviceProvider, 
          bookingDate, 
          timeSlot
        );
        break;

      // Add more module types as needed
      default:
        return res.status(400).json({
          success: false,
          message: `Module type "${moduleType}" is not supported yet`
        });
    }

    // -------------------------
    // USER HANDLING
    // -------------------------
    let user = null;
    let token = null;
    let finalUserDetails = {};

    if (bookingType === "Direct") {
      if (!fullName || !contactNumber || !emailAddress || !address) {
        return res.status(400).json({
          success: false,
          message: "fullName, contactNumber, emailAddress, and address are required for Direct booking"
        });
      }

      const [firstName, ...rest] = fullName.split(" ");
      const lastName = rest.join(" ");

      user = await User.findOne({ email: emailAddress });
      if (!user) {
        user = await User.create({
          firstName,
          lastName,
          email: emailAddress,
          password: "123456",
          userId: "USR-" + Date.now()
        });
      }

      // Get auth token
      try {
        const resp = await axios.post(AUTH_API_URL, { 
          email: emailAddress, 
          password: "123456" 
        });
        token = resp?.data?.token;
      } catch (error) {
        console.log("Auth token generation failed:", error.message);
      }

      finalUserDetails = { fullName, contactNumber, emailAddress, address };

    } else if (bookingType === "Indirect") {
      if (!userId) {
        return res.status(400).json({ 
          success: false, 
          message: "userId is required for Indirect booking" 
        });
      }

      user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      const profile = await Profile.findOne({ userId: user._id });

      finalUserDetails = {
        fullName: `${user.firstName} ${user.lastName || ""}`.trim(),
        contactNumber: profile?.mobileNumber || "N/A",
        emailAddress: user.email,
        address: profile?.address || "N/A"
      };
    }

    // -------------------------
    // PACKAGE PRICING
    // -------------------------
    let pkg = null;
    let packagePrice = 0;

    if (moduleType === "Makeup") {
      // For makeup, the package IS the makeup service itself
      pkg = serviceProvider; // The makeup object already has basePrice, finalPrice, etc.
      packagePrice = pkg.finalPrice || pkg.basePrice || 0;
    } else {
      // For other modules (Venues, etc.), use the Package model
      pkg = await Package.findById(packageId).lean();
      // If venue has no packages, skip package pricing
if (!packageId) {
  pkg = null;
  packagePrice = 0;
} else {
  pkg = await Package.findById(packageId).lean();
  if (!pkg) {
    return res.status(404).json({
      success: false,
      message: `Package not found`
    });
  }
  packagePrice = moduleType === "Venues"
    ? pkg.price * numberOfGuests
    : pkg.price;
}

     
    }

    // -------------------------
    // CALCULATE TOTAL PRICING
    // -------------------------
    let totalBeforeDiscount = pricingData.basePrice + packagePrice;

    const discountValue = pricingData.discount || 0;
    let afterDiscount = totalBeforeDiscount - discountValue;
    if (afterDiscount < 0) afterDiscount = 0;

    // -------------------------
    // APPLY COUPON
    // -------------------------
    let couponDiscountValue = 0;
    if (couponId) {
      const coupon = await Coupon.findById(couponId);
      if (coupon && coupon.isActive) {
        if (coupon.type === "percentage") {
          couponDiscountValue = (afterDiscount * coupon.discount) / 100;
        } else {
          couponDiscountValue = coupon.discount;
        }
      }
    }

    const finalPrice = afterDiscount - couponDiscountValue;

    // -------------------------
    // CREATE BOOKING DOCUMENT
    // -------------------------
    const bookingData = {
      moduleId,
      moduleType,
      packageId,
      providerId: serviceProvider.provider || serviceProvider?.createdBy,
      userId: user._id,
      bookingDate,
      timeSlot,
      bookingType,

      fullName: finalUserDetails.fullName,
      contactNumber: finalUserDetails.contactNumber,
      emailAddress: finalUserDetails.emailAddress,
      address: finalUserDetails.address,

      location: serviceProvider.location,

      perDayPrice: pricingData.perDayPrice || 0,
      perPersonCharge: pricingData.perPersonCharge || 0,
      perHourCharge: pricingData.perHourCharge || 0,
      packagePrice,

      totalBeforeDiscount,
      discountValue,
      discountType: discountValue > 0 ? "flat" : "none",
      couponDiscountValue,
      finalPrice,

      paymentType: paymentType || null // Add payment type
    };

    // Add module-specific fields
    if (moduleType === "Venues") {
      bookingData.venueId = venueId;
      bookingData.numberOfGuests = numberOfGuests;
    } else if (moduleType === "Makeup") {
      bookingData.makeupId = makeupId;
    }

    const booking = await Booking.create(bookingData);

    // Populate the booking
    let populateFields = ["packageId", "userId", "moduleId"];
    if (moduleType === "Venues") populateFields.push("venueId");
    if (moduleType === "Makeup") populateFields.push("makeupId");

    const populated = await Booking.findById(booking._id)
      .populate(populateFields)
      .select('+paymentStatus +paymentType +status +bookingType +finalPrice +totalBeforeDiscount +discountValue +couponDiscountValue')
      .lean();

    // Add timeline info
    const timeline = calculateTimeline(booking.bookingDate);

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: {
        ...populated,
        timeline
      },
      token
    });

  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
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
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    return res.json({ success: true, booking });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking ID",
      error: err.message
    });
  }
};


// ⭐ GET BOOKINGS BY PAYMENT STATUS FOR A PROVIDER
exports.getBookingsByPaymentStatus = async (req, res) => {
  try {
    const { providerId, paymentStatus } = req.params;

    const bookings = await Booking.find({
      providerId: providerId,
      paymentStatus: { $regex: new RegExp(`^${paymentStatus}$`, "i") } // case-insensitive
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
async function calculateVenuePricing(venue, bookingDate, timeSlot, numberOfGuests) {
  const bookingDay = new Date(bookingDate)
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();

  const slot = timeSlot.toLowerCase();

  const priceData = venue.pricingSchedule?.[bookingDay]?.[slot];
  // if (!priceData) {
  //   throw new Error(`No pricing found for ${bookingDay} - ${slot}`);
  // }
  if (!priceData) {
  return {
    basePrice: venue.basePrice || 0,
    perDayPrice: venue.basePrice || 0,
    perPersonCharge: 0,
    discount: venue.discount?.nonAc || 0
  };
}


  const perDayPrice = priceData.perDay || 0;
  const perPerson = priceData.perPerson || 0;

  const basePrice = perDayPrice > 0 
    ? perDayPrice 
    : perPerson * numberOfGuests;

  const discount = venue.discount?.nonAc || 0;

  return {
    basePrice,
    perDayPrice,
    perPersonCharge: perPerson * numberOfGuests,
    discount
  };
}

// =======================================================
// HELPER: CALCULATE MAKEUP PRICING
// =======================================================
async function calculateMakeupPricing(makeup, bookingDate, timeSlot) {
  // For makeup, no separate pricing - only package price will be used
  return {
    basePrice: 0,
    perDayPrice: 0,
    perHourCharge: 0,
    discount: 0
  };
}


exports.getPendingBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [
        { status: "Pending" },
        { paymentStatus: "pending" }
      ]
    }).sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getAcceptedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: "Accepted"
    }).sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCompletedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      paymentStatus: "completed"
    }).sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


exports.getRejectedBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: { $in: ["Rejected", "Cancelled"] }
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

    const bookings = await Booking.find({ providerId })
      .sort({ bookingDate: 1 })
      .populate("venueId")
      .populate("makeupId")
      .populate("packageId")
      .populate("userId")
      .populate("moduleId")
      .select('+paymentStatus +paymentType +status +bookingType +finalPrice +totalBeforeDiscount +discountValue +couponDiscountValue')
      .lean();

    // Add timeline info to each booking
    const bookingsWithTimeline = bookings.map(booking => ({
      ...booking,
      timeline: calculateTimeline(booking.bookingDate),
      paymentInfo: {
        status: booking.paymentStatus,
        type: booking.paymentType,
        finalPrice: booking.finalPrice,
        totalBeforeDiscount: booking.totalBeforeDiscount,
        discountValue: booking.discountValue,
        couponDiscountValue: booking.couponDiscountValue
      }
    }));

    res.json({ 
      success: true, 
      count: bookingsWithTimeline.length,
      data: bookingsWithTimeline 
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
      .populate("makeupId")
      .populate("packageId")
      .populate("userId")
      .populate("moduleId")
      .select('+paymentStatus +paymentType +status +bookingType +finalPrice +totalBeforeDiscount +discountValue +couponDiscountValue')
      .lean();

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
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
        amountPaid: booking.paymentStatus === "Paid" ? booking.finalPrice : 
                    booking.paymentStatus === "Advance" ? booking.advanceAmount || 0 : 0,
        amountDue: booking.paymentStatus === "Paid" ? 0 : booking.finalPrice
      }
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
      bookingDate: { $gte: today }
    })
      .sort({ bookingDate: 1 })
      .populate("venueId")
      .populate("makeupId")
      .populate("packageId")
      .populate("userId")
      .populate("moduleId")
      .select('+paymentStatus +paymentType +status +bookingType +finalPrice')
      .lean();

    // Add timeline info to each booking
    const bookingsWithTimeline = bookings.map(booking => ({
      ...booking,
      timeline: calculateTimeline(booking.bookingDate)
    }));

    // Group by payment status for easy filtering
    const summary = {
      total: bookings.length,
      byPaymentStatus: {
        paid: bookings.filter(b => b.paymentStatus === "Paid").length,
        advance: bookings.filter(b => b.paymentStatus === "Advance").length,
        pending: bookings.filter(b => b.paymentStatus === "Pending").length
      },
      byPaymentType: {
        cash: bookings.filter(b => b.paymentType === "Cash").length,
        card: bookings.filter(b => b.paymentType === "Card").length,
        upi: bookings.filter(b => ["UPI", "GPay", "PhonePe", "Paytm"].includes(b.paymentType)).length,
        bank: bookings.filter(b => ["Bank Transfer", "Net Banking"].includes(b.paymentType)).length,
        other: bookings.filter(b => b.paymentType === "Other").length,
        pending: bookings.filter(b => !b.paymentType).length
      },
      byTimeline: {
        today: bookingsWithTimeline.filter(b => b.timeline.isToday).length,
        upcoming: bookingsWithTimeline.filter(b => b.timeline.isUpcoming && !b.timeline.isToday).length
      }
    };

    res.json({ 
      success: true, 
      summary,
      data: bookingsWithTimeline 
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
      bookingDate: { $lt: today }
    })
      .sort({ bookingDate: -1 })
      .populate("venueId")
      .populate("makeupId")
      .populate("packageId")
      .populate("userId")
      .populate("moduleId")
      .select('+paymentStatus +paymentType +status +bookingType +finalPrice')
      .lean();

    // Add timeline info to each booking
    const bookingsWithTimeline = bookings.map(booking => ({
      ...booking,
      timeline: calculateTimeline(booking.bookingDate)
    }));

    // Group by payment status
    const summary = {
      total: bookings.length,
      byPaymentStatus: {
        paid: bookings.filter(b => b.paymentStatus === "Paid").length,
        advance: bookings.filter(b => b.paymentStatus === "Advance").length,
        pending: bookings.filter(b => b.paymentStatus === "Pending").length
      },
      byPaymentType: {
        cash: bookings.filter(b => b.paymentType === "Cash").length,
        card: bookings.filter(b => b.paymentType === "Card").length,
        upi: bookings.filter(b => ["UPI", "GPay", "PhonePe", "Paytm"].includes(b.paymentType)).length,
        bank: bookings.filter(b => ["Bank Transfer", "Net Banking"].includes(b.paymentType)).length,
        other: bookings.filter(b => b.paymentType === "Other").length,
        pending: bookings.filter(b => !b.paymentType).length
      }
    };

    res.json({ 
      success: true, 
      summary,
      data: bookingsWithTimeline 
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
        message: "Booking not found" 
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
        timeline
      }
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
        message: "Booking not found" 
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
        timeline
      }
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
        message: "Invalid payment status. Must be: Advance, Pending, or Paid" 
      });
    }

    // Validate payment type if provided
    const validPaymentTypes = ["Cash", "Card", "UPI", "GPay", "PhonePe", "Paytm", "Bank Transfer", "Net Banking", "Other"];
    if (paymentType && !validPaymentTypes.includes(paymentType)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid payment type. Must be one of: ${validPaymentTypes.join(", ")}` 
      });
    }

    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
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
          amountPaid: paymentStatus === "Paid" ? booking.finalPrice : 
                      paymentStatus === "Advance" ? booking.advanceAmount || 0 : 0,
          amountDue: paymentStatus === "Paid" ? 0 : booking.finalPrice
        }
      }
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
        message: "Booking not found" 
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
        timeline
      }
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
        message: "Invalid payment status. Must be: Advance, Pending, or Paid" 
      });
    }

    const bookings = await Booking.find({ 
      providerId, 
      paymentStatus 
    })
      .sort({ bookingDate: -1 })
      .populate("venueId")
      .populate("makeupId")
      .populate("packageId")
      .populate("userId")
      .populate("moduleId")
      .select('+paymentStatus +paymentType +status +bookingType +finalPrice +totalBeforeDiscount')
      .lean();

    // Add timeline info to each booking
    const bookingsWithTimeline = bookings.map(booking => ({
      ...booking,
      timeline: calculateTimeline(booking.bookingDate)
    }));

    // Calculate totals and group by payment type
    const totalAmount = bookings.reduce((sum, b) => sum + (b.finalPrice || 0), 0);

    const paymentTypeSummary = {
      cash: bookings.filter(b => b.paymentType === "Cash").reduce((sum, b) => sum + (b.finalPrice || 0), 0),
      card: bookings.filter(b => b.paymentType === "Card").reduce((sum, b) => sum + (b.finalPrice || 0), 0),
      upi: bookings.filter(b => ["UPI", "GPay", "PhonePe", "Paytm"].includes(b.paymentType)).reduce((sum, b) => sum + (b.finalPrice || 0), 0),
      bank: bookings.filter(b => ["Bank Transfer", "Net Banking"].includes(b.paymentType)).reduce((sum, b) => sum + (b.finalPrice || 0), 0),
      other: bookings.filter(b => b.paymentType === "Other").reduce((sum, b) => sum + (b.finalPrice || 0), 0)
    };

    res.json({ 
      success: true, 
      paymentStatus,
      count: bookingsWithTimeline.length,
      totalAmount,
      paymentTypeSummary,
      data: bookingsWithTimeline 
    });

  } catch (error) {
    console.error("Payment status filter error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// CHECK BOOKING TIMELINE STATUS
// =======================================================
exports.checkBookingTimeline = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).select('bookingDate').lean();

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        message: "Booking not found" 
      });
    }

    const timeline = calculateTimeline(booking.bookingDate);

    res.json({ 
      success: true, 
      data: {
        bookingId: booking._id,
        bookingDate: booking.bookingDate,
        timeline
      }
    });

  } catch (error) {
    console.error("Timeline check error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};