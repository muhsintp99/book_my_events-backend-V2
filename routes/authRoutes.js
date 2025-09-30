// const express = require('express');
// const router = express.Router();
// const authController = require('../controllers/authController');
// const { protect } = require('../middlewares/authMiddleware');
// const createUpload = require('../middlewares/upload');
// const {  verifyFirebaseToken } = require("../controllers/authController");



// const upload = createUpload('vendors', {
//   fileSizeMB: 2,
//   allowedTypes: [
//     'image/jpeg',
//     'image/png',
//     'application/pdf',
//     'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
//   ]
// });

// router.post(
//   '/register',
//   upload.fields([
//     { name: 'logo', maxCount: 1 },
//     { name: 'coverImage', maxCount: 1 },
//     { name: 'tinCertificate', maxCount: 1 }
//   ]),
//   authController.register
// );

// router.post('/login', authController.login);
// router.post('/logout', protect, authController.logout);
// router.post('/refresh-token', authController.refreshToken);
// router.post('/otpSend', authController.sendOtp);
// router.post('/otpVerify', authController.verifyOtp);
// router.post("/verify-firebase-token", verifyFirebaseToken);

// router.post('/forgot-password', authController.forgotPassword);
// router.post('/reset-password/:token', authController.resetPassword);

// module.exports = router;
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const createUpload = require('../middlewares/upload');
const { verifyFirebaseToken } = require("../controllers/authController");

const upload = createUpload('vendors', {
  fileSizeMB: 2,
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
});

// ---------------- REGISTER ----------------
router.post(
  '/register',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'tinCertificate', maxCount: 1 }
  ]),
  authController.register
);

// ---------------- LOGIN/LOGOUT ----------------
router.post('/login', authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);

// ---------------- OTP ----------------
router.post('/otpSend', authController.sendOtp);
router.post('/otpVerify', authController.verifyOtp);

// ---------------- FIREBASE ----------------
router.post("/verify-firebase-token", verifyFirebaseToken);

// ---------------- PASSWORD ----------------
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// ✅ GET route to serve Reset Password HTML form
router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password</title>
      <style>
        body { font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f3f3f3; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 300px; }
        input { width: 100%; padding: 10px; margin-bottom: 15px; border-radius: 5px; border: 1px solid #ccc; }
        button { width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background: #45a049; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Reset Password</h2>
        <form method="POST" action="/api/auth/reset-password/${token}">
          <input type="password" name="password" placeholder="New Password" required>
          <input type="password" name="confirmPassword" placeholder="Retype Password" required>
          <button type="submit">Reset Password</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

module.exports = router;
