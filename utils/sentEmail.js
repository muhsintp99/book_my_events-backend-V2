exports.welcomeEmail = (user) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6">
    <h2>Welcome to BookMyEvent 🎉</h2>
    <p>Hi <strong>${user.firstName}</strong>,</p>
    <p>Your account has been successfully created as a <strong>${user.role}</strong>.</p>
    <p><strong>User ID:</strong> ${user.userId}</p>
    <p>You can login using your registered email: <strong>${user.email}</strong>.</p>
    <br/>
    <p>Regards,<br/>BookMyEvent Team</p>
  </div>
`;

exports.otpEmail = (otp) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6">
    <h2>Your OTP Code</h2>
    <p>Use this One-Time Password to verify your account:</p>
    <h3>${otp}</h3>
    <p>This OTP will expire in 10 minutes.</p>
  </div>
`;

exports.resetPasswordEmail = (resetURL) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6">
    <h2>Password Reset</h2>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetURL}" style="background:#007bff;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">Reset Password</a></p>
    <p>This link is valid for 10 minutes.</p>
  </div>
`;
