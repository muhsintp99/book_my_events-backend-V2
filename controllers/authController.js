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

// const User = require("../models/User");
// const Subscription = require("../models/admin/Subscription");

// const { generateUserId } = require("../utils/generateId");
// const sendEmail = require("../utils/sendEmail");
// const {
//   welcomeEmail,
//   vendorEmail,
//   otpEmail,
//   resetPasswordEmail,
// } = require("../utils/sentEmail");
// const {
//   generateOtp,
//   generateResetToken,
//   generateJwtToken,
// } = require("../utils/tokenGenerator");
// const crypto = require("crypto");
// const VendorProfile = require("../models/vendor/vendorProfile");
// const mongoose = require("mongoose");

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
//       zone,
//     } = req.body;

//     // Parse nested storeAddress from FormData
//     const storeAddress = {
//       street: req.body["storeAddress[street]"] || "",
//       city: req.body["storeAddress[city]"] || "",
//       state: req.body["storeAddress[state]"] || "",
//       zipCode: req.body["storeAddress[zipCode]"] || "",
//       fullAddress: req.body["storeAddress[fullAddress]"] || "",
//     };

//     // Basic validation
//     if (!firstName || !lastName || !email) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields: firstName, lastName, email",
//       });
//     }

//     const validRoles = ["superadmin", "admin", "vendor", "user"];
//     if (role && !validRoles.includes(role)) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         success: false,
//         message: `Invalid role. Allowed roles: ${validRoles.join(", ")}`,
//       });
//     }

//     const existing = await User.findOne({ email }).session(session);
//     if (existing) {
//       await session.abortTransaction();
//       session.endSession();
//       return res
//         .status(400)
//         .json({ success: false, message: "Email already registered" });
//     }

//     let userPassword = password;
//     if (role === "vendor") {
//       userPassword = Math.random().toString(36).slice(-8);
//     } else {
//       if (!userPassword || userPassword.length < 6) {
//         await session.abortTransaction();
//         session.endSession();
//         return res.status(400).json({
//           success: false,
//           message:
//             "Password is required and must be at least 6 characters for non-vendor roles",
//         });
//       }
//       if (phone && !/^\+?[\d\s-]{10,}$/.test(phone)) {
//         await session.abortTransaction();
//         session.endSession();
//         return res
//           .status(400)
//           .json({ success: false, message: "Invalid phone number format" });
//       }
//     }

//     const userId = await generateUserId(role || "user");
//     const refreshToken = crypto.randomBytes(32).toString("hex");
//     const user = await User.create(
//       [
//         {
//           userId,
//           firstName,
//           lastName,
//           email,
//           password: userPassword,
//           phone,
//           role: role || "user",
//           refreshToken,
//         },
//       ],
//       { session }
//     );

//     let vendorProfile = null;
//     if (role === "vendor") {
//       vendorProfile = await VendorProfile.create(
//         [
//           {
//             storeName: storeName || "",
//             storeAddress,
//             logo: req.files?.logo
//               ? `/uploads/vendors/${req.files.logo[0].filename}`
//               : "",
//             coverImage: req.files?.coverImage
//               ? `/uploads/vendors/${req.files.coverImage[0].filename}`
//               : "",
//             tinCertificate: req.files?.tinCertificate
//               ? `/uploads/vendors/${req.files.tinCertificate[0].filename}`
//               : "",
//             ownerFirstName: firstName,
//             ownerLastName: lastName,
//             ownerPhone: phone || "",
//             ownerEmail: email,
//             businessTIN: businessTIN || "",
//             tinExpireDate: tinExpireDate || null,
//             // module: mongoose.Types.ObjectId.isValid(module) ? module : undefined,
//             // zone: mongoose.Types.ObjectId.isValid(zone) ? zone : undefined,
//             module: mongoose.Types.ObjectId.isValid(module)
//               ? new mongoose.Types.ObjectId(module)
//               : null,
//             zone: mongoose.Types.ObjectId.isValid(zone)
//               ? new mongoose.Types.ObjectId(zone)
//               : null,

//             user: user[0]._id,
//             status: "pending",
//           },
//         ],
//         { session }
//       );

//       vendorProfile = await VendorProfile.create(
//         [
//           {
//             storeName: storeName || "",
//             storeAddress,
//             logo: req.files?.logo
//               ? `/uploads/vendors/${req.files.logo[0].filename}`
//               : "",
//             coverImage: req.files?.coverImage
//               ? `/uploads/vendors/${req.files.coverImage[0].filename}`
//               : "",
//             tinCertificate: req.files?.tinCertificate
//               ? `/uploads/vendors/${req.files.tinCertificate[0].filename}`
//               : "",
//             ownerFirstName: firstName,
//             ownerLastName: lastName,
//             ownerPhone: phone || "",
//             ownerEmail: email,
//             businessTIN: businessTIN || "",
//             tinExpireDate: tinExpireDate || null,

//             // ⭐ ADD FREE TRIAL & SUBSCRIPTION FIELDS HERE
//             isFreeTrial: req.body.isFreeTrial === "true",
//             subscriptionPlan: req.body.subscriptionPlan || null,
//             subscriptionStatus:
//               req.body.isFreeTrial === "true" ? "trial" : "active",
//             trialStartDate: req.body.isFreeTrial === "true" ? new Date() : null,
//             trialEndDate:
//               req.body.isFreeTrial === "true"
//                 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
//                 : null,

//             module: mongoose.Types.ObjectId.isValid(module)
//               ? new mongoose.Types.ObjectId(module)
//               : null,
//             zone: mongoose.Types.ObjectId.isValid(zone)
//               ? new mongoose.Types.ObjectId(zone)
//               : null,

//             user: user[0]._id,
//             status: "pending",
//           },
//         ],
//         { session }
//       );
//     }

//     await session.commitTransaction();
//     session.endSession();

//     try {
//       if (role === "vendor") {
//         await sendEmail(
//           user[0].email,
//           "Your Vendor Account Credentials",
//           vendorEmail(user[0], userPassword)
//         );
//       } else {
//         await sendEmail(
//           user[0].email,
//           "Welcome to BookMyEvent",
//           welcomeEmail(user[0])
//         );
//       }
//     } catch (e) {
//       console.error("Email sending failed:", e.message);
//     }

//     const token = generateJwtToken({ id: user[0]._id });

//     res.status(201).json({
//       success: true,
//       message: `User registered as ${role || "user"}`,
//       user: user[0].toJSON(),
//       profile: vendorProfile ? vendorProfile[0].toJSON() : null,
//       token,
//       refreshToken,
//     });
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     console.error("Register Error:", err);
//     if (
//       err.message === "Failed to generate unique userId after multiple attempts"
//     ) {
//       return res.status(500).json({
//         success: false,
//         message: "Registration failed due to userId generation issue",
//         error: err.message,
//       });
//     }
//     res.status(500).json({
//       success: false,
//       message: "Registration failed",
//       error: err.message,
//     });
//   }
// };

// // ------------------ LIST PROVIDERS ------------------
// exports.listMakeupVendors = async (req, res) => {
//   try {
//     const { moduleId } = req.params;

//     const vendors = await VendorProfile.find({ module: moduleId })
//       .populate({
//         path: "user",
//         select: "firstName lastName email phone role",
//       })
//       .select("storeName logo coverImage module user");

//     const formatted = vendors.map((v) => ({
//       _id: v.user?._id,
//       firstName: v.user?.firstName,
//       lastName: v.user?.lastName,
//       email: v.user?.email,
//       phone: v.user?.phone,
//       storeName: v.storeName,
//       logo: v.logo ? `http://localhost:5000${v.logo}` : null,
//       coverImage: v.coverImage ? `http://localhost:5000${v.coverImage}` : null,
//       vendorProfileId: v._id,
//       module: v.module,
//     }));

//     res.status(200).json({
//       success: true,
//       count: formatted.length,
//       data: formatted,
//     });
//   } catch (err) {
//     console.error("Makeup Vendor List Error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch makeup vendors",
//       error: err.message,
//     });
//   }
// };

// // ------------------ LOGIN ------------------
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ message: "Provide email and password" });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     // Generate refresh token
//     const refreshToken = crypto.randomBytes(32).toString("hex");
//     user.refreshToken = refreshToken;
//     user.lastLogin = new Date();
//     await user.save();

//     // -------------------------------
//     // GET VENDOR PROFILE (IF VENDOR)
//     // -------------------------------
//     let vendorProfile = null;
//     if (user.role === "vendor") {
//       vendorProfile = await VendorProfile.findOne({ user: user._id }).populate([
//         {
//           path: "module",
//           select: "moduleId title icon categories isActive",
//           populate: {
//             path: "categories",
//             select: "title description isActive",
//           },
//         },
//         {
//           path: "zone",
//           select: "name description city country isActive",
//         },
//       ]);
//     }

//     // -----------------------------------------
//     // ⭐ ALWAYS define subscriptionInfo at top
//     // -----------------------------------------
//     let subscriptionInfo = {
//       isSubscribed: false,
//       plan: null,
//       expiresOn: null,
//       status: "none",
//     };

//     // -----------------------------------------
//     // FETCH SUBSCRIPTION DETAILS (ONLY FOR VENDORS)
//     // -----------------------------------------
//     // -----------------------------------------
//     // FETCH FULL SUBSCRIPTION DETAILS
//     // -----------------------------------------
//     if (user.role === "vendor") {
//       const subscriptionData = await Subscription.findOne({ userId: user._id })
//         .populate("planId") // <-- populate entire plan object
//         .populate("moduleId") // <-- optional but recommended
//         .sort({ createdAt: -1 });

//       if (subscriptionData) {
//         subscriptionInfo = {
//           isSubscribed:
//             subscriptionData.status === "active" ||
//             subscriptionData.status === "trial",

//           plan: subscriptionData.planId || null, // FULL PLAN DETAILS
//           module: subscriptionData.moduleId || null,

//           startDate: subscriptionData.startDate,
//           endDate: subscriptionData.endDate,

//           status: subscriptionData.status,
//           autoRenew: subscriptionData.autoRenew,
//           paymentId: subscriptionData.paymentId,
//           createdAt: subscriptionData.createdAt,
//         };
//       }
//     }

//     // Create JWT token
//     const token = generateJwtToken({ id: user._id });

//     return res.json({
//       message: "Logged in",
//       vendorId: user._id,
//       name: `${user.firstName} ${user.lastName}`,
//       token,
//       refreshToken,
//       profile: vendorProfile,

//       // ⭐ Subscription Data
//       subscription: subscriptionInfo,

//       user: user.toJSON(),
//     });
//   } catch (err) {
//     console.error("Login Error:", err);
//     return res
//       .status(500)
//       .json({ message: "Login failed", error: err.message });
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
//     res.json({ message: "Logged out successfully" });
//   } catch (err) {
//     console.error("Logout Error:", err);
//     res.status(500).json({ message: "Logout failed", error: err.message });
//   }
// };

// // ------------------ REFRESH TOKEN ------------------
// exports.refreshToken = async (req, res) => {
//   try {
//     const { refreshToken } = req.body;
//     if (!refreshToken) {
//       return res.status(400).json({ message: "Refresh token is required" });
//     }

//     const user = await User.findOne({ refreshToken });
//     if (!user)
//       return res.status(403).json({ message: "Invalid refresh token" });

//     const newAccessToken = generateJwtToken({ id: user._id });
//     const newRefreshToken = crypto.randomBytes(32).toString("hex");
//     user.refreshToken = newRefreshToken;
//     await user.save();

//     res.json({
//       message: "Token refreshed",
//       token: newAccessToken,
//       refreshToken: newRefreshToken,
//     });
//   } catch (err) {
//     console.error("Refresh Token Error:", err);
//     res
//       .status(500)
//       .json({ message: "Token refresh failed", error: err.message });
//   }
// };

// // ------------------ SEND OTP ------------------
// exports.sendOtp = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const otp = generateOtp();
//     user.otp = otp;
//     user.otpExpire =
//       Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || "10") * 60 * 1000;
//     await user.save();

//     try {
//       await sendEmail(email, "Your OTP Code", otpEmail(otp));
//     } catch (e) {
//       console.error("OTP email failed:", e.message);
//     }

//     res.json({ message: "OTP sent" });
//   } catch (err) {
//     res.status(500).json({ message: "Failed to send OTP", error: err.message });
//   }
// };

// // ------------------ VERIFY OTP ------------------
// exports.verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     const user = await User.findOne({
//       email,
//       otp,
//       otpExpire: { $gt: Date.now() },
//     });
//     if (!user)
//       return res.status(400).json({ message: "Invalid or expired OTP" });

//     user.isVerified = true;
//     user.otp = undefined;
//     user.otpExpire = undefined;
//     await user.save();

//     res.json({ message: "OTP verified" });
//   } catch (err) {
//     res.status(500).json({ message: "OTP verify failed", error: err.message });
//   }
// };

// // ------------------ FORGOT PASSWORD ------------------
// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const { resetToken, resetTokenHash } = generateResetToken();
//     console.log("🔑 RAW RESET TOKEN:", resetToken); // 👈 Add this line

//     user.resetPasswordToken = resetTokenHash;
//     user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
//     await user.save();

//     const resetURL = `${req.protocol}://${req.get(
//       "host"
//     )}/api/auth/reset-password/${resetToken}`;
//     try {
//       await sendEmail(email, "Password Reset", resetPasswordEmail(resetURL));
//     } catch (e) {
//       console.error("Reset email failed:", e.message);
//     }

//     res.json({ message: "Reset email sent" });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Forgot password failed", error: err.message });
//   }
// };

// // ------------------ VERIFY FIREBASE TOKEN (testing only, DB check skipped) ------------------
// // exports.verifyFirebaseToken = async (req, res) => {
// //   try {
// //     const { firebasetoken } = req.body; // or get from headers
// //     if (!firebasetoken) {
// //       return res.status(401).json({ valid: false, message: "Firebase token missing" });
// //     }

// //     // Verify token with Firebase
// //     const decodedToken = await admin.auth().verifyIdToken(firebasetoken);

// //     // ✅ Skip DB lookup for testing
// //     res.json({
// //       valid: true,
// //       firebaseUser: decodedToken,
// //       message: "Firebase token is valid"
// //     });
// //   } catch (err) {
// //     res.status(401).json({ valid: false, message: "Invalid or expired Firebase token", error: err.message });
// //   }
// // };

// // ------------------ RESET PASSWORD ------------------
// // exports.resetPassword = async (req, res) => {
// //   try {
// //     const token = req.params.token;
// //     const hash = crypto.createHash('sha256').update(token).digest('hex');

// //     const user = await User.findOne({
// //       resetPasswordToken: hash,
// //       resetPasswordExpire: { $gt: Date.now() }
// //     });
// //     if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

// //     const { password } = req.body;
// //     if (!password) return res.status(400).json({ message: 'Password is required' });

// //     user.password = password;
// //     user.resetPasswordToken = undefined;
// //     user.resetPasswordExpire = undefined;
// //     await user.save();

// //     res.json({ message: 'Password reset successful' });
// //   } catch (err) {
// //     res.status(500).json({ message: 'Reset password failed', error: err.message });
// //   }
// // };
// // ------------------ RESET PASSWORD ------------------
// exports.resetPassword = async (req, res) => {
//   try {
//     const token = req.params.token;
//     const hash = crypto.createHash("sha256").update(token).digest("hex");

//     const user = await User.findOne({
//       resetPasswordToken: hash,
//       resetPasswordExpire: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ message: "Invalid or expired token" });
//     }

//     const { password, confirmPassword } = req.body;

//     if (!password || !confirmPassword) {
//       return res.status(400).json({
//         message: "Password and confirm password are required",
//       });
//     }

//     if (password !== confirmPassword) {
//       return res.status(400).json({ message: "Passwords do not match" });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({
//         message: "Password must be at least 6 characters long",
//       });
//     }

//     // Update password
//     user.password = password;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;
//     await user.save();

//     res.json({ success: true, message: "Password reset successful" });
//   } catch (err) {
//     console.error("Reset Password Error:", err);
//     res.status(500).json({
//       message: "Reset password failed",
//       error: err.message,
//     });
//   }
// };

const User = require("../models/User");
const Subscription = require("../models/admin/Subscription");
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
      isFreeTrial,
      subscriptionPlan,
       accountHolderName,
  bankName,
  accountNumber,
  ifscCode,
  branchName,
  upiId
    } = req.body;

    const finalRole = req.body.role === "vendor" ? "vendor" : "user";

    // ❌ Prevent vendor fields for normal users
    if (finalRole === "user") {
      req.body.storeName = undefined;
      req.body.businessTIN = undefined;
      req.body.tinExpireDate = undefined;
      req.body.module = undefined;
      req.body.zone = undefined;
      req.body.subscriptionPlan = undefined;
      req.files = {};
    }

    // Parse nested storeAddress from FormData
    // const storeAddress = {
    //   street: req.body["storeAddress[street]"] || "",
    //   city: req.body["storeAddress[city]"] || "",
    //   state: req.body["storeAddress[state]"] || "",
    //   zipCode: req.body["storeAddress[zipCode]"] || "",
    //   fullAddress: req.body["storeAddress[fullAddress]"] || "",
    // };
    let storeAddress = {
  street: "",
  city: "",
  state: "",
  zipCode: "",
  fullAddress: ""
};

if (req.body.storeAddress) {
  try {
    storeAddress = JSON.parse(req.body.storeAddress);
  } catch (err) {
    console.error("Invalid storeAddress JSON", err);
  }
}


      // ✅ BANK DETAILS OBJECT
      // const bankDetails = {
      //   accountHolderName: accountHolderName || "",
      //   bankName: bankName || "",
      //   accountNumber: accountNumber || "",
      //   ifscCode: ifscCode || "",
      //   branchName: branchName || "",
      //   upiId: upiId || ""
      // };

      const bankDetails =
  finalRole === "vendor"
    ? {
        accountHolderName: accountHolderName || "",
        bankName: bankName || "",
        accountNumber: accountNumber || "",
        ifscCode: ifscCode || "",
        branchName: branchName || "",
        upiId: upiId || ""
      }
    : undefined;


    // Basic validation
    if (!firstName || !lastName || !email) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Missing required fields: firstName, lastName, email",
      });
    }

    const validRoles = ["superadmin", "admin", "vendor", "user"];
    if (role && !validRoles.includes(role)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${validRoles.join(", ")}`,
      });
    }

    const existing = await User.findOne({ email }).session(session);
    if (existing) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    let userPassword = password;
    if (finalRole === "vendor") {
      userPassword = Math.random().toString(36).slice(-8);
    } else {
      if (!userPassword || userPassword.length < 6) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message:
            "Password is required and must be at least 6 characters for non-vendor roles",
        });
      }
      if (phone && !/^\+?[\d\s-]{10,}$/.test(phone)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format",
        });
      }
    }

    const userId = await generateUserId(finalRole);
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
          role: finalRole,
          refreshToken,
        },
      ],
      { session }
    );

    let vendorProfile = null;
    if (role === "vendor") {
      const isFreeTrialBool = isFreeTrial === "true" || isFreeTrial === true;

      // ------------------ MODULE LOGIC FOR BIO & VENDOR TYPE ------------------
      const ModuleModel = mongoose.model("Module");
      const moduleData = await ModuleModel.findById(module);
      const moduleName = moduleData?.title?.toLowerCase() || "";

const isBioModule =
  moduleName === "makeup artist" || moduleName === "photography";

const isVendorTypeModule = moduleName === "makeup artist";

      // Prepare bio fields
      const bioSection = isBioModule
        ? {
            title: req.body.bioTitle || "",
            subtitle: req.body.bioSubtitle || "",
            description: req.body.bioDescription || "",
          }
        : undefined;

      // Prepare vendorType field ONLY for makeup
      const vendorTypeValue = isVendorTypeModule
        ? req.body.vendorType || "individual"
        : undefined;

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

                      bankDetails,

            // ⭐ ADD BIO + VENDOR TYPE HERE
            bio: bioSection,
            vendorType: vendorTypeValue,

            // ⭐ SUBSCRIPTION FIELDS
            isFreeTrial: isFreeTrialBool,
            subscriptionPlan: isFreeTrialBool ? null : subscriptionPlan,
            subscriptionStatus: isFreeTrialBool ? "trial" : "pending_payment",
            trialStartDate: isFreeTrialBool ? new Date() : null,
            trialEndDate: isFreeTrialBool
              ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              : null,

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

    // Send emails
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

    // ✅ POPULATE vendorProfile to include bio and vendorType in response
    if (vendorProfile) {
      vendorProfile = await VendorProfile.findById(vendorProfile[0]._id)
        .populate("module", "title")
        .populate("zone", "name");
    }

    // ✅ ENHANCED RESPONSE FORMAT
    const responseData = {
      success: true,
      message: `User registered as ${role || "user"}`,

      // ⭐ Provider ID in multiple formats
      providerId: user[0]._id.toString(),
      userId: user[0]._id.toString(),
      _id: user[0]._id.toString(),
      id: user[0]._id.toString(),

      // Original fields
      user: user[0].toJSON(),
      profile: vendorProfile ? vendorProfile.toJSON() : null, // ✅ Now includes bio & vendorType
      token,
      refreshToken,

      // Additional structured data
      data: {
        providerId: user[0]._id.toString(),
        _id: user[0]._id.toString(),
        userId: user[0]._id.toString(),
        id: user[0]._id.toString(),
        email: user[0].email,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
        role: user[0].role,
        subscriptionStatus: vendorProfile ? vendorProfile.subscriptionStatus : null,
        isFreeTrial: vendorProfile ? vendorProfile.isFreeTrial : false,
        subscriptionPlan: vendorProfile ? vendorProfile.subscriptionPlan : null,
        // ✅ Include bio and vendorType in data object too
        bio: vendorProfile?.bio || null,
        vendorType: vendorProfile?.vendorType || null,

          bankDetails: vendorProfile?.bankDetails || null

      },
    };

    return res.status(201).json(responseData);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Register Error:", err);

    if (err.message === "Failed to generate unique userId after multiple attempts") {
      return res.status(500).json({
        success: false,
        message: "Registration failed due to userId generation issue",
        error: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: err.message,
    });
  }
};
// ------------------ LIST PROVIDERS ------------------
exports.listMakeupVendors = async (req, res) => {
  try {
    const { moduleId } = req.params;

    const vendors = await VendorProfile.find({ module: moduleId })
      .populate({
        path: "user",
        select: "firstName lastName email phone role",
      })
      .select(
        "storeName logo coverImage module user subscriptionStatus isFreeTrial"
      );

    const API_BASE_URL =
      process.env.NODE_ENV === "production"
        ? "https://api.bookmyevent.ae"
        : "http://localhost:5000";

    const formatted = vendors.map((v) => ({
      _id: v.user?._id,
      firstName: v.user?.firstName,
      lastName: v.user?.lastName,
      email: v.user?.email,
      phone: v.user?.phone,
      storeName: v.storeName,
      logo: v.logo ? `${API_BASE_URL}${v.logo}` : null,
      coverImage: v.coverImage ? `${API_BASE_URL}${v.coverImage}` : null,
      vendorProfileId: v._id,
      module: v.module,
      subscriptionStatus: v.subscriptionStatus,
      isFreeTrial: v.isFreeTrial,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    console.error("❌ Makeup Vendor List Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch makeup vendors",
      error: err.message,
    });
  }
};

// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Provide email and password",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString("hex");
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // GET VENDOR PROFILE (IF VENDOR)
    // let vendorProfile = null;
    // if (user.role === "vendor") {
    //   vendorProfile = await VendorProfile.findOne({ user: user._id }).populate([
    //     {
    //       path: "module",
    //       select: "moduleId title icon categories isActive",
    //       populate: {
    //         path: "categories",
    //         select: "title description isActive",
    //       },
    //     },
    //     {
    //       path: "zone",
    //       select: "name description city country isActive",
    //     },
    //   ]);
    // }

    // // SUBSCRIPTION INFO
    // let subscriptionInfo = {
    //   isSubscribed: false,
    //   plan: null,
    //   expiresOn: null,
    //   status: "none",
    // };

    // // FETCH SUBSCRIPTION DETAILS (ONLY FOR VENDORS)
    // if (user.role === "vendor") {
    //   const subscriptionData = await Subscription.findOne({ userId: user._id })
    //     .populate("planId")
    //     .populate("moduleId")
    //     .sort({ createdAt: -1 });

    //   if (subscriptionData) {
    //     subscriptionInfo = {
    //       isSubscribed:
    //         subscriptionData.status === "active" ||
    //         subscriptionData.status === "trial",

    //       plan: subscriptionData.planId || null,
    //       module: subscriptionData.moduleId || null,

    //       startDate: subscriptionData.startDate,
    //       endDate: subscriptionData.endDate,

    //       status: subscriptionData.status,
    //       autoRenew: subscriptionData.autoRenew,
    //       paymentId: subscriptionData.paymentId,
    //       createdAt: subscriptionData.createdAt,
    //     };
    //   }
    // }




    // GET VENDOR PROFILE (IF VENDOR)
let vendorProfile = null;
if (user.role === "vendor") {
  vendorProfile = await VendorProfile.findOne({ user: user._id }).populate([
    {
      path: "module",
      select: "moduleId title icon categories isActive",
      populate: {
        path: "categories",
        select: "title description isActive",
      },
    },
    {
      path: "zone",
      select: "name description city country isActive",
    },
  ]);
}

/* =====================================================
   🔥 ADD THIS BLOCK RIGHT HERE (EXACT PLACE)
===================================================== */

// ================= SUBSCRIPTION + UPGRADE DETAILS =================
let upgradeDetails = {
  isSubscribed: false,
  status: "none",
  plan: null,
  module: null,
  billing: null,
  access: {
    canAccess: false,
    isTrial: false,
    isExpired: false,
    daysLeft: 0
  }
};

if (user.role === "vendor") {
  const subscription = await Subscription.findOne({ userId: user._id })
    .populate("planId")
    .populate("moduleId")
    .sort({ createdAt: -1 });

  if (subscription) {
    const now = new Date();
    const isExpired = subscription.endDate < now;
    const daysLeft = Math.max(
      0,
      Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24))
    );

    upgradeDetails = {
      isSubscribed: ["active", "trial"].includes(subscription.status),
      status: subscription.status,

      plan: subscription.planId,
      module: subscription.moduleId,

      billing: {
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        paymentId: subscription.paymentId,
        autoRenew: subscription.autoRenew
      },

      access: {
        canAccess: subscription.status === "active" && !isExpired,
        isTrial: subscription.status === "trial",
        isExpired,
        daysLeft
      }
    };

    // 🔥 SYNC INTO VENDOR PROFILE
    if (vendorProfile) {
      vendorProfile.subscriptionPlan = subscription.planId?._id;
      vendorProfile.subscriptionStatus = subscription.status;
      vendorProfile.subscriptionStartDate = subscription.startDate;
      vendorProfile.subscriptionEndDate = subscription.endDate;
      vendorProfile.lastPaymentDate = subscription.createdAt;
      vendorProfile.isFreeTrial = subscription.status === "trial";

      await vendorProfile.save();
    }
  }
}


    // Create JWT token
    const token = generateJwtToken({ id: user._id });

    // return res.json({
    //   success: true,
    //   message: "Logged in successfully",
    //   vendorId: user._id,
    //   name: `${user.firstName} ${user.lastName}`,
    //   token,
    //   refreshToken,
    //   profile: vendorProfile,
    //   subscription: subscriptionInfo,
    //   user: user.toJSON(),
    // });

    return res.json({
  success: true,
  message: "Logged in successfully",

  vendorId: user._id,
  name: `${user.firstName} ${user.lastName}`,

  token,
  refreshToken,

  profile: vendorProfile,
  upgrade: upgradeDetails, // 🔥 FULL UPGRADE DETAILS
  user: user.toJSON(),
});

  } catch (err) {
    console.error("❌ Login Error:", err);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: err.message,
    });
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
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("❌ Logout Error:", err);
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: err.message,
    });
  }
};

// ------------------ REFRESH TOKEN ------------------
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(403).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const newAccessToken = generateJwtToken({ id: user._id });
    const newRefreshToken = crypto.randomBytes(32).toString("hex");
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      message: "Token refreshed",
      token: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    console.error("❌ Refresh Token Error:", err);
    res.status(500).json({
      success: false,
      message: "Token refresh failed",
      error: err.message,
    });
  }
};

// ------------------ SEND OTP ------------------
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpire =
      Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES || "10") * 60 * 1000;
    await user.save();

    try {
      await sendEmail(email, "Your OTP Code", otpEmail(otp));
    } catch (e) {
      console.error("❌ OTP email failed:", e.message);
    }

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    console.error("❌ Send OTP Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: err.message,
    });
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

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (err) {
    console.error("❌ Verify OTP Error:", err);
    res.status(500).json({
      success: false,
      message: "OTP verification failed",
      error: err.message,
    });
  }
};

// ------------------ FORGOT PASSWORD ------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { resetToken, resetTokenHash } = generateResetToken();
    console.log("🔑 RAW RESET TOKEN:", resetToken);

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/api/auth/reset-password/${resetToken}`;

    try {
      await sendEmail(email, "Password Reset", resetPasswordEmail(resetURL));
    } catch (e) {
      console.error("❌ Reset email failed:", e.message);
    }

    res.json({
      success: true,
      message: "Reset email sent successfully",
    });
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res.status(500).json({
      success: false,
      message: "Forgot password failed",
      error: err.message,
    });
  }
};

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
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("❌ Reset Password Error:", err);
    res.status(500).json({
      success: false,
      message: "Reset password failed",
      error: err.message,
    });
  }
};

module.exports = exports;
