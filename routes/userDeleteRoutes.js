const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

// 🔹 DELETE USER FUNCTION
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password." });
    }

    // Delete user
    await User.deleteOne({ _id: user._id });

    return res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

module.exports = router;
