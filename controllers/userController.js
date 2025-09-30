const User = require('../models/User');

// ✅ Get logged-in user's profile
exports.getMe = async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all users (admin/superadmin)
// exports.getAllUsers = async (req, res) => {
//   try {
//     const users = await User.find().select('-password');
//     res.json({ users });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


exports.getAllUsers = async (req, res) => {
  try {
    const filter = {};

    // Dynamic filtering based on query parameters
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isVerified) filter.isVerified = req.query.isVerified === 'true';
    if (req.query.isActive) filter.isActive = req.query.isActive === 'true';

    const users = await User.find(filter).select('-password');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get one user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update user
exports.updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User updated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Block user
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User blocked', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Reactivate user
exports.reactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User reactivated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
