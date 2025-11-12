const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

/* ------------------------------
 🔹 POST /api/delete-user
 Delete a user after verifying email & password
------------------------------ */
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password." });
    }

    await User.deleteOne({ _id: user._id });

    return res
      .status(200)
      .json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error." });
  }
});

/* ------------------------------
 🔹 GET /api/delete-user
 Serve Delete Profile HTML Form
------------------------------ */
router.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Delete Profile</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: #f8f9ff;
          margin: 0;
        }
        .card {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          padding: 30px;
          text-align: center;
          width: 90%;
          max-width: 400px;
        }
        .avatar {
          background: #E15B65;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .avatar svg { fill: #fff; width: 40px; height: 40px; }
        h2 { color: #2f2f46; margin-bottom: 10px; }
        p { color: #6b6b8a; font-size: 15px; margin-bottom: 25px; }
        input {
          width: 100%;
          padding: 10px;
          margin-bottom: 15px;
          border: 1px solid #ccc;
          border-radius: 6px;
          box-sizing: border-box;
        }
        button {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 6px;
          background: #E15B65;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }
        button:disabled { opacity: 0.7; cursor: not-allowed; }
        .cancel {
          display: inline-block;
          margin-top: 12px;
          color: #2f2f46;
          text-decoration: none;
          font-size: 14px;
        }
        .cancel:hover { text-decoration: underline; }
        .message {
          margin-top: 10px;
          font-size: 14px;
          display: none;
        }
        .error { color: #c62828; display: block; }
        .success { color: #2e7d32; display: block; }
        .spinner {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255,255,255,0.4);
          border-top: 3px solid #fff;
          border-radius: 50%;
          display: inline-block;
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="avatar">
          <svg viewBox="0 0 24 24">
            <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z"/>
          </svg>
        </div>
        <h2>Delete Profile?</h2>
        <p>Are you sure you want to delete your profile? This action cannot be undone.</p>
        <input id="email" type="email" placeholder="Email" />
        <input id="password" type="password" placeholder="Password" />
        <button id="deleteBtn">Delete</button>
        <a href="/" class="cancel">Cancel</a>
        <div id="msg" class="message"></div>
      </div>

      <script>
        const emailInput = document.getElementById('email');
        const storedEmail = localStorage.getItem('userEmail');
        if (storedEmail) {
          emailInput.value = storedEmail;
          emailInput.disabled = true;
        }

        document.getElementById('deleteBtn').addEventListener('click', async () => {
          const email = emailInput.value.trim();
          const password = document.getElementById('password').value.trim();
          const msg = document.getElementById('msg');
          const btn = document.getElementById('deleteBtn');

          if (!email || !password) {
            msg.className = 'message error';
            msg.textContent = 'Email and password are required.';
            return;
          }

          btn.disabled = true;
          btn.innerHTML = '<span class="spinner"></span>';

          try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/delete-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: token ? 'Bearer ' + token : ''
              },
              body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (res.ok) {
              msg.className = 'message success';
              msg.textContent = data.message || 'User deleted successfully!';
              localStorage.clear();
              setTimeout(() => window.location.href = '/', 1500);
            } else {
              msg.className = 'message error';
              msg.textContent = data.message || 'Failed to delete account.';
              btn.disabled = false;
              btn.textContent = 'Delete';
            }
          } catch (err) {
            console.error('Delete error:', err);
            msg.className = 'message error';
            msg.textContent = 'Network error. Try again later.';
            btn.disabled = false;
            btn.textContent = 'Delete';
          }
        });
      </script>
    </body>
    </html>
  `);
});

module.exports = router;
