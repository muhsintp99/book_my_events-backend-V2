// exports.welcomeEmail = (user) => `
//   <div style="font-family:Arial,sans-serif;line-height:1.6">
//     <h2>Welcome to BookMyEvent 🎉</h2>
//     <p>Hi <strong>${user.firstName}</strong>,</p>
//     <p>Your account has been successfully created as a <strong>${user.role}</strong>.</p>
//     <p><strong>User ID:</strong> ${user.userId}</p>
//     <p>You can login using your registered email: <strong>${user.email}</strong>.</p>
//     <br/>
//     <p>
//       <a href="https://vendor.bookmyevent.ae/" 
//          style="display:inline-block;background-color:#007bff;color:#fff;
//                 padding:10px 20px;text-decoration:none;border-radius:5px;">
//          Click here to login
//       </a>
//     </p>
//     <br/>
//     <p>Regards,<br/>BookMyEvent Team</p>
//   </div>
// `;















exports.welcomeEmail = (user) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6">
    <h2>Welcome to BookMyEvent 🎉</h2>
    <p>Hi <strong>${user.firstName}</strong>,</p>
    <p>Your account has been successfully created as a <strong>${user.role}</strong>.</p>
    
    ${
      user.role === "user"
        ? `<p><strong>User ID:</strong> ${user.userId}</p>`
        : ""
    }

    <p>You can login using your registered email: <strong>${user.email}</strong>.</p>

    <br/>
    <p>
      <a href="https://bookmyevent.ae/login.html"
         style="display:inline-block;background-color:#007bff;color:#fff;
                padding:10px 20px;text-decoration:none;border-radius:5px;">
         Click here to login
      </a>
    </p>

    <br/>
    <p>Regards,<br/>BookMyEvent Team</p>
  </div>
`;



// exports.vendorEmail = (user, password) => `
//   <div style="font-family:Arial,sans-serif;line-height:1.6">
//     <h2>Welcome to Book My Event 🎉</h2>
//     <p>Hi <strong>${user.firstName}</strong>,</p>
//     <p>Your vendor account has been successfully created.</p>
//     <p><strong>Vendor ID:</strong> ${user.userId}</p>
//     <p><strong>Email:</strong> ${user.email}</p>
//     <p><strong>Password:</strong> ${password}</p>
//     <p style="color:red;">⚠️ Please change your password after your first login.</p>
//     <br/>
//     <p>
//       <a href="https://vendor.bookmyevent.ae/" 
//          style="display:inline-block;background-color:#007bff;color:#fff;
//                 padding:10px 20px;text-decoration:none;border-radius:5px;">
//          Click here to login
//       </a>
//     </p>
//     <br/>
//     <p>Regards,<br/>BookMyEvent Team</p>
//   </div>
// `;






exports.vendorEmail = (user, password) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6">
    <h2>Welcome to Book My Event 🎉</h2>
    <p>Hi <strong>${user.firstName}</strong>,</p>
    <p>Your vendor account has been successfully created.</p>

    <p><strong>Vendor ID:</strong> ${user.userId}</p>
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Password:</strong> ${password}</p>

    <p style="color:red;">⚠️ Please change your password after your first login.</p>
    <br/>

    <p>
      <a href="https://vendor.bookmyevent.ae/"
         style="display:inline-block;background-color:#007bff;color:#fff;
                padding:10px 20px;text-decoration:none;border-radius:5px;">
         Click here to login
      </a>
    </p>

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

exports.bookingConfirmationEmail = (booking) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
    <h2 style="color:#4CAF50;">🎉 Your Booking is Confirmed!</h2>

    <p>Hi <strong>${booking.fullName}</strong>,</p>

    <p>Your booking at <strong>BookMyEvent</strong> has been successfully <strong>CONFIRMED</strong>.</p>

    <h3>📌 Booking Details</h3>

    <p><strong>Booking ID:</strong> ${booking._id}</p>
    <p><strong>Event Type:</strong> ${booking.eventType || "Corporate Conference"}</p>
    <p><strong>Date:</strong> ${new Date(booking.bookingDate).toDateString()}</p>
    <p><strong>Guests:</strong> ${booking.numberOfGuests}</p>
    <p><strong>Final Price:</strong> ₹${booking.finalPrice}</p>

    <h3>📅 Event Schedule</h3>

    <p><strong>Setup Time:</strong> ${booking.setupTime || "9:00 AM - 10:00 AM"}</p>
    <p><strong>Event Time:</strong> ${booking.eventTime || "10:00 AM - 6:00 PM"}</p>

    <br/>

    <p>
      <a href="https://bookmyevent.ae/my-bookings"
         style="background:#4CAF50;color:white;padding:10px 18px;
                text-decoration:none;border-radius:6px;display:inline-block;">
         View Booking
      </a>
    </p>

    <br/>
    <p>Thank you for choosing BookMyEvent!<br/>We are excited to host your event 🎊</p>

    <p>Best Regards,<br/><strong>BookMyEvent Team</strong></p>
  </div>
`;
