// const User = require('../models/User');
// const { generateUserId } = require('../utils/generateId');
// const sendEmail = require('../utils/sendEmail');
// const { welcomeEmail, vendorEmail, otpEmail, resetPasswordEmail } = require('../utils/sentEmail');
// const { generateOtp, generateResetToken, generateJwtToken } = require('../utils/tokenGenerator');
// const crypto = require('crypto');
// const VendorProfile = require('../models/vendor/vendorProfile');

// // ------------------ REGISTER ------------------
// exports.register = async (req, res) => {
//   const session = await User.startSession();
//   session.startTransaction();
//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       phone,
//       role,
//       password,
//       storeName,
//       businessTIN,
//       tinExpireDate,
//       module,
//       zone
//     } = req.body;

//     // Parse nested storeAddress from FormData
//     const storeAddress = {
//       street: req.body['storeAddress[street]'] || '',
//       city: req.body['storeAddress[city]'] || '',
//       state: req.body['storeAddress[state]'] || '',
//       zipCode: req.body['storeAddress[zipCode]'] || '',
//       fullAddress: req.body['storeAddress[fullAddress]'] || ''
//     };

//     // Basic validation for all roles
//     if (!firstName || !lastName || !email) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: 'Missing required fields: firstName, lastName, email' });
//     }

//     // Role validation
//     const validRoles = ['superadmin', 'admin', 'vendor', 'user'];
//     if (role && !validRoles.includes(role)) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: `Invalid role. Allowed roles: ${validRoles.join(', ')}` });
//     }

//     const existing = await User.findOne({ email }).session(session);
//     if (existing) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ success: false, message: 'Email already registered' });
//     }

//     // Password handling based on role
//     let userPassword = password;
//     if (role === 'vendor') {
//       userPassword = Math.random().toString(36).slice(-8);
//     } else {
//       if (!userPassword || userPassword.length < 6) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({ success: false, message: 'Password is required and must be at least 6 characters for non-vendor roles' });
//       }
//       if (phone && !/^\+?[\d\s-]{10,}$/.test(phone)) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({ success: false, message: 'Invalid phone number format' });
//       }
//     }

//     const userId = await generateUserId(role || 'user');
//     const refreshToken = crypto.randomBytes(32).toString('hex');
//     const user = await User.create(
//       [{
//         userId,
//         firstName,
//         lastName,
//         email,
//         password: userPassword,
//         phone,
//         role: role || 'user',
//         refreshToken
//       }],
//       { session }
//     );

//     let vendorProfile = null;
//     if (role === 'vendor') {
//       vendorProfile = await VendorProfile.create(
//         [{
//           storeName: storeName || '',
//           storeAddress,
//           logo: req.files?.logo ? `/uploads/vendors/${req.files.logo[0].filename}` : '',
//           coverImage: req.files?.coverImage ? `/uploads/vendors/${req.files.coverImage[0].filename}` : '',
//           tinCertificate: req.files?.tinCertificate ? `/uploads/vendors/${req.files.tinCertificate[0].filename}` : '',
//           ownerFirstName: firstName,
//           ownerLastName: lastName,
//           ownerPhone: phone || '',
//           ownerEmail: email,
//           businessTIN: businessTIN || '',
//           tinExpireDate: tinExpireDate || null,
//           module: module || null,
//           zone: zone || null,
//           user: user[0]._id,
//           status: 'pending'
//         }],
//         { session }
//       );
//     }

//     await session.commitTransaction();
//     session.endSession();

//     try {
//       if (role === 'vendor') {
//         await sendEmail(
//           user[0].email,
//           'Your Vendor Account Credentials',
//           vendorEmail(user[0], userPassword)
//         );
//       } else {
//         await sendEmail(
//           user[0].email,
//           'Welcome to BookMyEvent',
//           welcomeEmail(user[0])
//         );
//       }
//     } catch (e) {
//       console.error('Email sending failed:', e.message);
//     }

//     const token = generateJwtToken({ id: user[0]._id });

//     res.status(201).json({
//       success: true,
//       message: `User registered as ${role || 'user'}`,
//       user: user[0].toJSON(),
//       profile: vendorProfile ? vendorProfile[0].toJSON() : null,
//       token,
//       refreshToken
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Register Error:", err);
//     if (err.message === 'Failed to generate unique userId after multiple attempts') {
//       return res.status(500).json({ success: false, message: 'Registration failed due to userId generation issue', error: err.message });
//     }
//     res.status(500).json({ success: false, message: 'Registration failed', error: err.message });
//   }
// };

// // ------------------ LOGIN ------------------
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password)
//       return res.status(400).json({ message: 'Provide email and password' });

//     const user = await User.findOne({ email });
//     if (!user) return res.status(401).json({ message: 'Invalid credentials' });

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

//     const refreshToken = crypto.randomBytes(32).toString('hex');
//     user.refreshToken = refreshToken;
//     user.lastLogin = new Date();
//     await user.save();

//     let vendorProfile = null;
//     if (user.role === 'vendor') {
//       vendorProfile = await VendorProfile.findOne({ user: user._id }).populate([
//         {
//           path: "module",
//           select: "moduleId title icon categories isActive createdAt updatedAt",
//           populate: {
//             path: "categories",
//             select: "title description isActive createdAt updatedAt",
//           },
//         },
//         {
//           path: "zone",
//           select: "name description coordinates city country isActive",
//         },
//       ]);
//     }

//     const token = generateJwtToken({ id: user._id });
//     res.json({
//       message: 'Logged in',
//       user: user.toJSON(),
//       profile: vendorProfile,
//       token,
//       refreshToken
//     });
//   } catch (err) {
//     console.error("Login Error:", err);
//     res.status(500).json({ message: 'Login failed', error: err.message });
//   }
// };

// // ------------------ LOGOUT ------------------
// exports.logout = async (req, res) => {
//   try {
//     if (req.user) {
//       const user = await User.findById(req.user._id);
//       if (user) {
//         user.refreshToken = undefined;
//         await user.save();
//       }
//     }
//     res.json({ message: 'Logged out successfully' });
//   } catch (err) {
//     console.error("Logout Error:", err);
//     res.status(500).json({ message: 'Logout failed', error: err.message });
//   }
// };

// // ------------------ REFRESH TOKEN ------------------
// exports.refreshToken = async (req, res) => {
//   try {
//     const { refreshToken } = req.body;
//     if (!refreshToken) {
//       return res.status(400).json({ message: 'Refresh token is required' });
//     }

//     const user = await User.findOne({ refreshToken });
//     if (!user) {
//       return res.status(403).json({ message: 'Invalid refresh token' });
//     }

//     const newAccessToken = generateJwtToken({ id: user._id });
//     const newRefreshToken = crypto.randomBytes(32).toString('hex');
//     user.refreshToken = newRefreshToken;
//     await user.save();

//     res.json({
//       message: 'Token refreshed',
//       token: newAccessToken,
//       refreshToken: newRefreshToken
//     });
//   } catch (err) {
//     console.error("Refresh Token Error:", err);
//     res.status(500).json({ message: 'Token refresh failed', error: err.message });
//   }
// };

// // ------------------ SEND OTP ------------------
// exports.sendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const otp = generateOtp();
//     user.otp = otp;
//     user.otpExpire = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000);
//     await user.save();

//     try {
//       await sendEmail(email, 'Your OTP Code', otpEmail(otp));
//     } catch (e) {
//       console.error('OTP email failed:', e.message);
//     }

//     res.json({ message: 'OTP sent' });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to send OTP', error: err.message });
//   }
// };

// // ------------------ VERIFY OTP ------------------
// exports.verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     const user = await User.findOne({ email, otp, otpExpire: { $gt: Date.now() } });
//     if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

//     user.isVerified = true;
//     user.otp = undefined;
//     user.otpExpire = undefined;
//     await user.save();

//     res.json({ message: 'OTP verified' });
//   } catch (err) {
//     res.status(500).json({ message: 'OTP verify failed', error: err.message });
//   }
// };

// // ------------------ FORGOT PASSWORD ------------------
// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const { resetToken, resetTokenHash } = generateResetToken();
//     user.resetPasswordToken = resetTokenHash;
//     user.resetPasswordExpire = Date.now() + (10 * 60 * 1000);
//     await user.save();

//     const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
//     try {
//       await sendEmail(email, 'Password Reset', resetPasswordEmail(resetURL));
//     } catch (e) {
//       console.error('Reset email failed:', e.message);
//     }

//     res.json({ message: 'Reset email sent' });
//   } catch (err) {
//     res.status(500).json({ message: 'Forgot password failed', error: err.message });
//   }
// };

// // ------------------ RESET PASSWORD ------------------
// exports.resetPassword = async (req, res) => {
//   try {
//     const token = req.params.token;
//     const hash = crypto.createHash('sha256').update(token).digest('hex');

//     const user = await User.findOne({
//       resetPasswordToken: hash,
//       resetPasswordExpire: { $gt: Date.now() }
//     });
//     if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

//     const { password } = req.body;
//     if (!password) return res.status(400).json({ message: 'Password is required' });

//     user.password = password;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;
//     await user.save();

//     res.json({ message: 'Password reset successful' });
//   } catch (err) {
//     res.status(500).json({ message: 'Reset password failed', error: err.message });
//   }
// };

const User = require("../models/User");
const { generateUserId } = require("../utils/generateId");
const sendEmail = require("../utils/sendEmail");
const {
  welcomeEmail,
  vendorEmail,
  otpEmail,
  resetPasswordEmail,
} = require("../utils/sentEmail");
const {
  generateOtp,
  generateResetToken,
  generateJwtToken,
} = require("../utils/tokenGenerator");
const crypto = require("crypto");
const VendorProfile = require("../models/vendor/vendorProfile");
const mongoose = require("mongoose");

// ------------------ REGISTER ------------------
exports.register = async (req, res) => {
  const session = await User.startSession();
  session.startTransaction();
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      password,
      storeName,
      businessTIN,
      tinExpireDate,
      module,
      zone,
    } = req.body;

    // Parse nested storeAddress from FormData
    const storeAddress = {
      street: req.body["storeAddress[street]"] || "",
      city: req.body["storeAddress[city]"] || "",
      state: req.body["storeAddress[state]"] || "",
      zipCode: req.body["storeAddress[zipCode]"] || "",
      fullAddress: req.body["storeAddress[fullAddress]"] || "",
    };

    // Basic validation
    if (!firstName || !lastName || !email) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({
          success: false,
          message: "Missing required fields: firstName, lastName, email",
        });
    }

    const validRoles = ["superadmin", "admin", "vendor", "user"];
    if (role && !validRoles.includes(role)) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({
          success: false,
          message: `Invalid role. Allowed roles: ${validRoles.join(", ")}`,
        });
    }

    const existing = await User.findOne({ email }).session(session);
    if (existing) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    let userPassword = password;
    if (role === "vendor") {
      userPassword = Math.random().toString(36).slice(-8);
    } else {
      if (!userPassword || userPassword.length < 6) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Password is required and must be at least 6 characters for non-vendor roles",
          });
      }
      if (phone && !/^\+?[\d\s-]{10,}$/.test(phone)) {
        await session.abortTransaction();
        session.endSession();
        return res
          .status(400)
          .json({ success: false, message: "Invalid phone number format" });
      }
    }

    const userId = await generateUserId(role || "user");
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const user = await User.create(
      [
        {
          userId,
          firstName,
          lastName,
          email,
          password: userPassword,
          phone,
          role: role || "user",
          refreshToken,
        },
      ],
      { session }
    );

    let vendorProfile = null;
    if (role === "vendor") {
      vendorProfile = await VendorProfile.create(
        [
          {
            storeName: storeName || "",
            storeAddress,
            logo: req.files?.logo
              ? `/uploads/vendors/${req.files.logo[0].filename}`
              : "",
            coverImage: req.files?.coverImage
              ? `/uploads/vendors/${req.files.coverImage[0].filename}`
              : "",
            tinCertificate: req.files?.tinCertificate
              ? `/uploads/vendors/${req.files.tinCertificate[0].filename}`
              : "",
            ownerFirstName: firstName,
            ownerLastName: lastName,
            ownerPhone: phone || "",
            ownerEmail: email,
            businessTIN: businessTIN || "",
            tinExpireDate: tinExpireDate || null,
            // module: mongoose.Types.ObjectId.isValid(module) ? module : undefined,
            // zone: mongoose.Types.ObjectId.isValid(zone) ? zone : undefined,
            module: mongoose.Types.ObjectId.isValid(module)
              ? new mongoose.Types.ObjectId(module)
              : null,
            zone: mongoose.Types.ObjectId.isValid(zone)
              ? new mongoose.Types.ObjectId(zone)
              : null,

            user: user[0]._id,
            status: "pending",
          },
        ],
        { session }
      );
    }

    await session.commitTransaction();
    session.endSession();

    try {
      if (role === "vendor") {
        await sendEmail(
          user[0].email,
          "Your Vendor Account Credentials",
          vendorEmail(user[0], userPassword)
        );
      } else {
        await sendEmail(
          user[0].email,
          "Welcome to BookMyEvent",
          welcomeEmail(user[0])
        );
      }
    } catch (e) {
      console.error("Email sending failed:", e.message);
    }

    const token = generateJwtToken({ id: user[0]._id });

    res.status(201).json({
      success: true,
      message: `User registered as ${role || "user"}`,
      user: user[0].toJSON(),
      profile: vendorProfile ? vendorProfile[0].toJSON() : null,
      token,
      refreshToken,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Register Error:", err);
    if (
      err.message === "Failed to generate unique userId after multiple attempts"
    ) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Registration failed due to userId generation issue",
          error: err.message,
        });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Registration failed",
        error: err.message,
      });
  }
};



// ------------------ LIST PROVIDERS ------------------
exports.listProviders = async (req, res) => {
  try {
    const providers = await require("../models/vendor/vendorProfile")
      .find({})
      .select("storeName logo coverImage _id")
      .populate({
        path: "user",
        select: "firstName lastName email role",
      });

    res.status(200).json({
      success: true,
      count: providers.length,
      providers,
    });
  } catch (err) {
    console.error("List Providers Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch providers",
      error: err.message,
    });
  }
};



// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Provide email and password" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const refreshToken = crypto.randomBytes(32).toString("hex");
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    let vendorProfile = null;
    if (user.role === "vendor") {
      vendorProfile = await VendorProfile.findOne({ user: user._id }).populate([
        {
          path: "module",
          select: "moduleId title icon categories isActive createdAt updatedAt",
          populate: {
            path: "categories",
            select: "title description isActive createdAt updatedAt",
          },
        },
        {
          path: "zone",
          select: "name description coordinates city country isActive",
        },
      ]);
    }

    const token = generateJwtToken({ id: user._id });
    res.json({
      message: "Logged in",
      user: user.toJSON(),
      profile: vendorProfile,
      token,
      refreshToken,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// ------------------ LOGOUT ------------------
exports.logout = async (req, res) => {
  try {
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};

// ------------------ REFRESH TOKEN ------------------
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const user = await User.findOne({ refreshToken });
    if (!user)
      return res.status(403).json({ message: "Invalid refresh token" });

    const newAccessToken = generateJwtToken({ id: user._id });
    const newRefreshToken = crypto.randomBytes(32).toString("hex");
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      message: "Token refreshed",
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("Refresh Token Error:", err);
    res
      .status(500)
      .json({ message: "Token refresh failed", error: err.message });
  }
};

// ------------------ SEND OTP ------------------
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpire =
      Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || "10") * 60 * 1000;
    await user.save();

    try {
      await sendEmail(email, "Your OTP Code", otpEmail(otp));
    } catch (e) {
      console.error("OTP email failed:", e.message);
    }

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send OTP", error: err.message });
  }
};

// ------------------ VERIFY OTP ------------------
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({
      email,
      otp,
      otpExpire: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: "OTP verify failed", error: err.message });
  }
};

// ------------------ FORGOT PASSWORD ------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const { resetToken, resetTokenHash } = generateResetToken();
    console.log("🔑 RAW RESET TOKEN:", resetToken); // 👈 Add this line

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/reset-password/${resetToken}`;
    try {
      await sendEmail(email, "Password Reset", resetPasswordEmail(resetURL));
    } catch (e) {
      console.error("Reset email failed:", e.message);
    }

    res.json({ message: "Reset email sent" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Forgot password failed", error: err.message });
  }
};

// ------------------ VERIFY FIREBASE TOKEN (testing only, DB check skipped) ------------------
// exports.verifyFirebaseToken = async (req, res) => {
//   try {
//     const { firebasetoken } = req.body; // or get from headers
//     if (!firebasetoken) {
//       return res.status(401).json({ valid: false, message: "Firebase token missing" });
//     }

//     // Verify token with Firebase
//     const decodedToken = await admin.auth().verifyIdToken(firebasetoken);

//     // ✅ Skip DB lookup for testing
//     res.json({
//       valid: true,
//       firebaseUser: decodedToken,
//       message: "Firebase token is valid"
//     });
//   } catch (err) {
//     res.status(401).json({ valid: false, message: "Invalid or expired Firebase token", error: err.message });
//   }
// };

// ------------------ RESET PASSWORD ------------------
// exports.resetPassword = async (req, res) => {
//   try {
//     const token = req.params.token;
//     const hash = crypto.createHash('sha256').update(token).digest('hex');

//     const user = await User.findOne({
//       resetPasswordToken: hash,
//       resetPasswordExpire: { $gt: Date.now() }
//     });
//     if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

//     const { password } = req.body;
//     if (!password) return res.status(400).json({ message: 'Password is required' });

//     user.password = password;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;
//     await user.save();

//     res.json({ message: 'Password reset successful' });
//   } catch (err) {
//     res.status(500).json({ message: 'Reset password failed', error: err.message });
//   }
// };
// ------------------ RESET PASSWORD ------------------
exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    const hash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Password and confirm password are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    // ✅ Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res
      .status(500)
      .json({ message: "Reset password failed", error: err.message });
  }
};
