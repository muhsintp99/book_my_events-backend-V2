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


router.get('/providers', authController.listProviders);
// ---------------- LOGIN/LOGOUT ----------------
router.post('/login', authController.login);
router.post('/logout', protect, authController.logout);
router.post('/refresh-token', authController.refreshToken);

// ---------------- OTP ----------------
router.post('/otpSend', authController.sendOtp);
router.post('/otpVerify', authController.verifyOtp);

// ---------------- FIREBASE ----------------
// router.post("/verify-firebase-token", verifyFirebaseToken);

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
        body { font-family: Arial; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f3f3f3; margin: 0; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 90%; max-width: 400px; }
        input { width: 100%; padding: 12px; margin-bottom: 15px; border-radius: 5px; border: 1px solid #ccc; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #45a049; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .message { padding: 10px; margin-bottom: 15px; border-radius: 5px; display: none; }
        .error { background: #ffebee; color: #c62828; display: block; }
        .success { background: #e8f5e9; color: #2e7d32; display: block; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Reset Password</h2>
        <div id="message" class="message"></div>
        <form id="resetForm">
          <input type="password" id="password" name="password" placeholder="New Password" required minlength="6">
          <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Retype Password" required minlength="6">
          <button type="submit" id="submitBtn">Reset Password</button>
        </form>
      </div>

      <script>
        document.getElementById('resetForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const messageDiv = document.getElementById('message');
          const submitBtn = document.getElementById('submitBtn');

          if (password !== confirmPassword) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Passwords do not match!';
            return;
          }

          // Disable button during request
          submitBtn.disabled = true;
          submitBtn.textContent = 'Resetting...';

          try {
            const response = await fetch('/api/auth/reset-password/${token}', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ password, confirmPassword })
            });

            const data = await response.json();

            if (response.ok) {
              messageDiv.className = 'message success';
              messageDiv.textContent = data.message || 'Password reset successful! Redirecting...';
              
              // ✅ Redirect to your frontend login page
              setTimeout(() => {
                window.location.href = 'http://localhost:5173/login'; // For development
                // window.location.href = 'https://vendor.bookmyevent.ae/login'; // For production
              }, 2000);
            } else {
              messageDiv.className = 'message error';
              messageDiv.textContent = data.message || 'Password reset failed';
              submitBtn.disabled = false;
              submitBtn.textContent = 'Reset Password';
            }
          } catch (error) {
            console.error('Reset error:', error);
            messageDiv.className = 'message error';
            messageDiv.textContent = 'Network error. Please try again.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
          }
        });
      </script>
    </body>
    </html>
  `);
});
module.exports = router;
