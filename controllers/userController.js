// const User = require('../models/User');

// // ✅ Get logged-in user's profile
// exports.getMe = async (req, res) => {
//   try {
//     res.json({ user: req.user.toJSON() });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ✅ Get all users (admin/superadmin)
// // exports.getAllUsers = async (req, res) => {
// //   try {
// //     const users = await User.find().select('-password');
// //     res.json({ users });
// //   } catch (err) {
// //     res.status(500).json({ message: err.message });
// //   }
// // };


// exports.getAllUsers = async (req, res) => {
//   try {
//     const filter = {};

//     // Dynamic filtering based on query parameters
//     if (req.query.role) filter.role = req.query.role;
//     if (req.query.isVerified) filter.isVerified = req.query.isVerified === 'true';
//     if (req.query.isActive) filter.isActive = req.query.isActive === 'true';

//     const users = await User.find(filter).select('-password');
//     res.json({ users });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


// // ✅ Get one user by ID
// exports.getUserById = async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id).select('-password');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json({ user });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ✅ Update user
// exports.updateUser = async (req, res) => {
//   try {
//     const updates = { ...req.body };
//     delete updates.password;
//     const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json({ message: 'User updated', user });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ✅ Delete user
// exports.deleteUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id);
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json({ message: 'User deleted' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ✅ Block user
// exports.blockUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json({ message: 'User blocked', user });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ✅ Reactivate user
// exports.reactivateUser = async (req, res) => {
//   try {
//     const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }).select('-password');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json({ message: 'User reactivated', user });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');

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
exports.getMe = async (req, res) => {
  try {
    res.json({ user: req.user?.toJSON?.() || req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   GET ALL USERS
===================================================== */
// exports.getAllUsers = async (req, res) => {
//   try {
//     const filter = {};

//     if (req.query.role) filter.role = req.query.role;
//     if (req.query.isVerified)
//       filter.isVerified = req.query.isVerified === 'true';
//     if (req.query.isActive)
//       filter.isActive = req.query.isActive === 'true';

//     const users = await User.find(filter).select('-password');
//     res.json({ users });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   GET USER BY ID
===================================================== */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   UPDATE USER (with optional photo upload)
===================================================== */
exports.updateUser = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    /* ---------- PHOTO UPLOAD ---------- */
    if (req.file) {
      if (user.profilePhoto) {
        await deleteFile(user.profilePhoto);
      }

      user.profilePhoto = `Uploads/profile/${req.file.filename}`;
    }

    /* ---------- NORMAL FIELDS ---------- */
    const fields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "mobile",
      "role"
    ];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });

    await user.save();

    const safe = user.toObject();
    delete safe.password;

    res.json({
      message: "User updated",
      user: safe
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   DELETE USER
===================================================== */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.profilePhoto) await deleteFile(user.profilePhoto);

    await user.deleteOne();

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   BLOCK USER
===================================================== */
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User blocked', user });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   REACTIVATE USER
===================================================== */
exports.reactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User reactivated', user });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
