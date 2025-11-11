const axios = require("axios");
const Booking = require("../../models/vendor/Booking");
const User = require("../../models/User");
const Venue = require("../../models/vendor/Venue");
const Package = require("../../models/admin/Package");
const Profile = require("../../models/vendor/Profile");

const AUTH_API_URL = "https://api.bookmyevent.ae/api/auth/login";

// ========================================================
// 🔹 CREATE BOOKING (Direct + Indirect)
// ========================================================
exports.createBooking = async (req, res) => {
  try {
    const {
      venueId,
      packageId,
      fullName,
      contactNumber,
      emailAddress,
      address,
      numberOfGuests,
      bookingDate,
      timeSlot,
      bookingType, // "Direct" or "Indirect"
      userId, // optional for Indirect
    } = req.body;

    // ✅ Validate required fields (Direct only)
    if (
      !venueId ||
      !packageId ||
      !numberOfGuests ||
      !bookingDate ||
      !timeSlot ||
      !bookingType
    ) {
      return res.status(400).json({ message: "All required fields are missing" });
    }

    // ✅ Find venue
    const venue = await Venue.findById(venueId).lean();
    if (!venue) return res.status(404).json({ message: "Venue not found" });

    const providerId = venue.provider?._id || venue.providerId || null;
    let user = null;
    let token = null;
    let bookingUserDetails = {};

    // 🟢 DIRECT BOOKING — Auto create user + token
    if (bookingType === "Direct") {
      if (!emailAddress || !fullName || !contactNumber || !address) {
        return res.status(400).json({
          message: "Full name, contact number, email, and address are required for Direct booking",
        });
      }

      // ✅ Split fullName into first/last names
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // ✅ Find or create user
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

      // ✅ Generate login token
      const { data } = await axios.post(AUTH_API_URL, {
        email: emailAddress,
        password: "123456",
      });
      token = data?.token || null;

      bookingUserDetails = {
        fullName,
        contactNumber,
        emailAddress,
        address,
      };
    }

    // 🔵 INDIRECT BOOKING — Vendor/Admin passes userId
    if (bookingType === "Indirect") {
      if (!userId)
        return res.status(400).json({ message: "userId is required for Indirect booking" });

      user = await User.findById(userId);
      if (!user)
        return res.status(404).json({ message: "User not found with given userId" });

      // ✅ Get profile details
      const profile = await Profile.findOne({ userId: user._id });

      bookingUserDetails = {
        fullName: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim(),
        contactNumber: profile?.mobileNumber || "",
        emailAddress: user.email,
        address: profile?.address || "",
      };
    }

    // ✅ Create booking record
  // ✅ Prepare booking data
let bookingData = {
  providerId,
  userId: user?._id || null,
  venueId,
  packageId,
  numberOfGuests,
  bookingDate,
  timeSlot,
  bookingType,
  status: "Pending",
};

// 🟦 Add user details differently based on booking type
if (bookingType === "Direct") {
  bookingData = {
    ...bookingData,
    fullName: bookingUserDetails.fullName,
    contactNumber: bookingUserDetails.contactNumber,
    emailAddress: bookingUserDetails.emailAddress,
    address: bookingUserDetails.address,
  };
} else if (bookingType === "Indirect") {
  bookingData = {
    ...bookingData,
    fullName: bookingUserDetails.fullName || "N/A",
    contactNumber: bookingUserDetails.contactNumber || "N/A",
    emailAddress: bookingUserDetails.emailAddress || "N/A",
    address: bookingUserDetails.address || "N/A",
  };
}


    const booking = await Booking.create(bookingData);

    // ✅ Populate venue, package, and user details
    let populatedBooking = await Booking.findById(booking._id)
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

    // ✅ Format user object
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
      message: "Booking created successfully",
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
          fullName: `${u.firstName}${u.lastName ? " " + u.lastName : ""}`.trim(),
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
          fullName: `${u.firstName}${u.lastName ? " " + u.lastName : ""}`.trim(),
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
