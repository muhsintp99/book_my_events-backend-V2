const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/responseFormatter');

/* =====================================================
   DELETE FILE UTILITY
===================================================== */
const deleteFile = async (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, "..", filePath);
  try {
    await fs.access(fullPath);
    await fs.unlink(fullPath);
  } catch {}
};

/* =====================================================
   GET ME
===================================================== */
exports.getMe = asyncHandler(async (req, res) => {
  const user = req.user?.toJSON?.() || req.user;
  return successResponse(res, user);
});

/* =====================================================
   GET ALL USERS
===================================================== */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");
  return successResponse(res, users);
});

/* =====================================================
   GET USER BY ID
===================================================== */
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, user);
});

/* =====================================================
   UPDATE USER (with optional photo upload)
===================================================== */
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return errorResponse(res, "User not found", 404);

  /* ---------- PHOTO UPLOAD ---------- */
  if (req.file) {
    if (user.profilePhoto) {
      await deleteFile(user.profilePhoto);
    }
    user.profilePhoto = `Uploads/profile/${req.file.filename}`;
  }

  /* ---------- NORMAL FIELDS ---------- */
  const fields = ["firstName", "lastName", "email", "phone", "mobile", "role"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) user[f] = req.body[f];
  });

  await user.save();

  const safe = user.toObject();
  delete safe.password;

  return successResponse(res, safe, "User updated successfully");
});

/* =====================================================
   DELETE USER
===================================================== */
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return errorResponse(res, "User not found", 404);

  if (user.profilePhoto) await deleteFile(user.profilePhoto);
  await user.deleteOne();

  return successResponse(res, null, "User deleted successfully");
});

/* =====================================================
   BLOCK USER
===================================================== */
exports.blockUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select('-password');

  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, user, 'User blocked successfully');
});

/* =====================================================
   REACTIVATE USER
===================================================== */
exports.reactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  ).select('-password');

  if (!user) return errorResponse(res, 'User not found', 404);
  return successResponse(res, user, 'User reactivated successfully');
});

