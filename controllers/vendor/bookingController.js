const axios = require("axios");
const Booking = require("../../models/vendor/Booking");
const User = require("../../models/User");
const Venue = require("../../models/vendor/Venue");
const Package = require("../../models/admin/Package");
const Profile = require("../../models/vendor/Profile");
const Coupon = require("../../models/admin/coupons");

const AUTH_API_URL = "https://api.bookmyevent.ae/api/auth/login";

// ========================================================
// 🔹 CREATE BOOKING (Direct + Indirect)
// ========================================================
exports.createBooking = async (req, res) => {
  try {
    const {
      venueId,
      packageId,
      couponId, // ✅ new field
      fullName,
      contactNumber,
      emailAddress,
      address,
      numberOfGuests,
      bookingDate,
      timeSlot,
      bookingType,
      userId,
    } = req.body;

    if (!venueId || !packageId || !bookingDate || !timeSlot || !bookingType) {
      return res.status(400).json({ message: "All required fields are missing" });
    }

    const venue = await Venue.findById(venueId).lean();
    if (!venue) return res.status(404).json({ message: "Venue not found" });

    const providerId = venue.provider?._id || venue.providerId || null;
    let user = null;
    let token = null;
    let bookingUserDetails = {};

    // ------------------- DIRECT BOOKING -------------------
    if (bookingType === "Direct") {
      if (!emailAddress || !fullName || !contactNumber || !address) {
        return res.status(400).json({
          message: "Full name, contact number, email, and address are required for Direct booking",
        });
      }

      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      user = await User.findOne({ email: emailAddress });
      if (!user) {
        user = new User({
          firstName,
          lastName,
          email: emailAddress,
          password: "123456",
          userId: "USR-" + Date.now(),
        });
        await user.save();
      }

      const { data } = await axios.post(AUTH_API_URL, {
        email: emailAddress,
        password: "123456",
      });
      token = data?.token || null;

      bookingUserDetails = { fullName, contactNumber, emailAddress, address };
    }

    // ------------------- INDIRECT BOOKING -------------------
    if (bookingType === "Indirect") {
      if (!userId) return res.status(400).json({ message: "userId is required for Indirect booking" });

      user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found with given userId" });

      const profile = await Profile.findOne({ userId: user._id });

      bookingUserDetails = {
        fullName: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim(),
        contactNumber: profile?.mobileNumber || "N/A",
        emailAddress: user.email,
        address: profile?.address || "N/A",
      };
    }

    // ------------------- PRICE CALCULATION -------------------
    const packageData = await Package.findById(packageId).lean();
    if (!packageData) return res.status(404).json({ message: "Package not found" });

    const bookingDay = new Date(bookingDate)
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();

    const slotKey = Array.isArray(timeSlot) ? timeSlot[0].toLowerCase() : timeSlot.toLowerCase();
    const dayPricing = venue.pricingSchedule?.[bookingDay]?.[slotKey];
    if (!dayPricing)
      return res.status(400).json({ message: `No pricing available for ${bookingDay} ${timeSlot}` });

    const perDayPrice = dayPricing.perDay || 0;
    const perPerson = dayPricing.perPerson || 0;
    const perHourCharge = dayPricing.perHour || 0;

    const packagePrice = (packageData.price || 0) * (numberOfGuests || 0);

    let totalBeforeDiscount = 0;
    if (perDayPrice > 0) {
      totalBeforeDiscount = perDayPrice + packagePrice;
    } else if (perPerson > 0) {
      totalBeforeDiscount = perPerson * numberOfGuests + packagePrice;
    } else {
      totalBeforeDiscount = packagePrice;
    }

    // ✅ Venue Discount
    const flatDiscount = venue.discount?.nonAc || 0;
    const discountValue = flatDiscount > totalBeforeDiscount ? totalBeforeDiscount : flatDiscount;
    const discountType = flatDiscount > 0 ? "flat" : "none";
    let afterVenueDiscount = Math.max(totalBeforeDiscount - discountValue, 0);

    // ✅ Coupon Discount
    let couponDiscountValue = 0;
    if (couponId) {
      const coupon = await Coupon.findById(couponId);
      const now = new Date();

      if (
        coupon &&
        coupon.isActive &&
        new Date(coupon.startDate) <= now &&
        new Date(coupon.expireDate) >= now &&
        coupon.usedCount < coupon.totalUses
      ) {
        if (coupon.type === "percentage" && coupon.discount > 0) {
          couponDiscountValue = (afterVenueDiscount * coupon.discount) / 100;
        } else if (coupon.type === "flat" && coupon.discount > 0) {
          couponDiscountValue = coupon.discount;
        }

        // Ensure discount doesn’t exceed total
        if (couponDiscountValue > afterVenueDiscount) {
          couponDiscountValue = afterVenueDiscount;
        }

        // Optionally increase used count
        await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } });
      }
    }

    const finalPrice = Math.max(afterVenueDiscount - couponDiscountValue, 0);

    // ------------------- CREATE BOOKING -------------------
    const bookingData = {
      providerId,
      userId: user?._id || null,
      venueId,
      packageId,
      couponId: couponId || null,
      numberOfGuests,
      bookingDate,
      timeSlot: [timeSlot],
      bookingType,
      status: "Pending",
      fullName: bookingUserDetails.fullName,
      contactNumber: bookingUserDetails.contactNumber,
      emailAddress: bookingUserDetails.emailAddress,
      address: bookingUserDetails.address,
      perDayPrice,
      perPersonCharge: perPerson * (numberOfGuests || 0),
      perHourCharge,
      packagePrice,
      totalBeforeDiscount,
      discountValue,
      discountType,
      couponDiscountValue,
      finalPrice,
    };

    const booking = await Booking.create(bookingData);

    let populatedBooking = await Booking.findById(booking._id)
      .populate("venueId")
      .populate("packageId")
      .populate("couponId")
      .populate("userId", "firstName lastName email userId");

    if (populatedBooking.userId) {
      const u = populatedBooking.userId;
      populatedBooking = populatedBooking.toObject();
      populatedBooking.userId = {
        _id: u._id,
        userId: u.userId,
        fullName: `${u.firstName}${u.lastName ? " " + u.lastName : ""}`.trim(),
        email: u.email,
        id: u._id,
      };
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully with coupon applied",
      data: populatedBooking,
      token: token || null,
    });
  } catch (error) {
    console.error("Booking creation error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
// ========================================================
// 🔹 GET BOOKING BY ID
// ========================================================
exports.getBookingById = async (req, res) => {
  try {
    let booking = await Booking.findById(req.params.id)
      .populate({
        path: "venueId",
        model: "Venue",
        populate: {
          path: "categories.module",
          model: "Module",
        },
      })
      .populate({
        path: "packageId",
        model: "Package",
        populate: {
          path: "categories",
          model: "Category",
        },
      })
      .populate("userId", "firstName lastName email userId");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // ✅ Format user object
    if (booking.userId) {
      const u = booking.userId;
      booking = booking.toObject();
      booking.userId = {
        _id: u._id,
        userId: u.userId,
        fullName: `${u.firstName}${u.lastName ? " " + u.lastName : ""}`.trim(),
        email: u.email,
        id: u._id,
      };
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error("Get booking error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ========================================================
// 🔹 GET BOOKINGS BY USER
// ========================================================
exports.getBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    let bookings = await Booking.find({ userId })
      .populate({
        path: "venueId",
        model: "Venue",
        populate: {
          path: "categories.module",
          model: "Module",
        },
      })
      .populate({
        path: "packageId",
        model: "Package",
        populate: {
          path: "categories",
          model: "Category",
        },
      })
      .populate("userId", "firstName lastName email userId");

    if (!bookings.length)
      return res.status(404).json({ message: "No bookings found" });

    // ✅ Format all user objects
    bookings = bookings.map((b) => {
      if (b.userId) {
        const u = b.userId;
        const formatted = b.toObject();
        formatted.userId = {
          _id: u._id,
          userId: u.userId,
          fullName: `${u.firstName}${
            u.lastName ? " " + u.lastName : ""
          }`.trim(),
          email: u.email,
          id: u._id,
        };
        return formatted;
      }
      return b;
    });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Get bookings by user error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ========================================================
// 🔹 GET BOOKINGS BY PROVIDER
// ========================================================
exports.getBookingsByProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    let bookings = await Booking.find({ providerId })
      .populate({
        path: "venueId",
        model: "Venue",
        populate: {
          path: "categories.module",
          model: "Module",
        },
      })
      .populate({
        path: "packageId",
        model: "Package",
        populate: {
          path: "categories",
          model: "Category",
        },
      })
      .populate("userId", "firstName lastName email userId");

    if (!bookings.length)
      return res.status(404).json({ message: "No bookings found" });

    // ✅ Format all user objects
    bookings = bookings.map((b) => {
      if (b.userId) {
        const u = b.userId;
        const formatted = b.toObject();
        formatted.userId = {
          _id: u._id,
          userId: u.userId,
          fullName: `${u.firstName}${
            u.lastName ? " " + u.lastName : ""
          }`.trim(),
          email: u.email,
          id: u._id,
        };
        return formatted;
      }
      return b;
    });

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Get bookings by provider error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
