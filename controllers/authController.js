const User = require('../models/User');
const { generateUserId } = require('../utils/generateId');
const sendEmail = require('../utils/sendEmail');
const { welcomeEmail, otpEmail, resetPasswordEmail } = require('../utils/sentEmail');
const { generateOtp, generateResetToken, generateJwtToken } = require('../utils/tokenGenerator');
const crypto = require('crypto');

// ------------------ REGISTER ------------------
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const userId = await generateUserId(role || 'user');

    const user = await User.create({
      userId,
      firstName,
      lastName,
      email,
      password,       // ❗️no manual hash — handled by pre('save')
      phone,
      role: role || 'user'
    });

    try {
      await sendEmail(user.email, 'Welcome to BookMyEvent', welcomeEmail(user));
    } catch (e) {
      console.error('Welcome email failed:', e.message);
    }

    const token = generateJwtToken({ id: user._id });
    res.status(201).json({ message: 'User registered', user: user.toJSON(), token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Provide email and password' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // ⛔ don't deleted this section
    // if (!user.isVerified) return res.status(403).json({ message: 'Account not verified' });
    // if (!user.isActive) return res.status(403).json({ message: 'Account is deactivated' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = generateJwtToken({ id: user._id });
    res.json({ message: 'Logged in', user: user.toJSON(), token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// ------------------ LOGOUT ------------------
exports.logout = (req, res) => {
  res.json({ message: 'Logged out (client should discard the token)' });
};

// ------------------ SEND OTP ------------------
exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpire = Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000);
    await user.save();

    try {
      await sendEmail(email, 'Your OTP Code', otpEmail(otp));
    } catch (e) {
      console.error('OTP email failed:', e.message);
    }

    res.json({ message: 'OTP sent' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP', error: err.message });
  }
};

// ------------------ VERIFY OTP ------------------
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, otp, otpExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({ message: 'OTP verified' });
  } catch (err) {
    res.status(500).json({ message: 'OTP verify failed', error: err.message });
  }
};

// ------------------ FORGOT PASSWORD ------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { resetToken, resetTokenHash } = generateResetToken();
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpire = Date.now() + (10 * 60 * 1000);
    await user.save();

    const resetURL = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    try {
      await sendEmail(email, 'Password Reset', resetPasswordEmail(resetURL));
    } catch (e) {
      console.error('Reset email failed:', e.message);
    }

    res.json({ message: 'Reset email sent' });
  } catch (err) {
    res.status(500).json({ message: 'Forgot password failed', error: err.message });
  }
};

// ------------------ RESET PASSWORD ------------------
exports.resetPassword = async (req, res) => {
  try {
    const token = req.params.token;
    const hash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hash,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password is required' });

    user.password = password;  // ❗️no manual hash — pre('save') will hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Reset password failed', error: err.message });
  }
};
