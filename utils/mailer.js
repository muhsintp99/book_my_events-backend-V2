const nodemailer = require('nodemailer');
require('dotenv').config(); // make sure this is at the top

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // smtp.hostinger.com
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true, // ✅ true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection
transporter.verify((err, success) => {
  if (err) console.error('❌ Mailer verify error:', err);
  else console.log('✅ Mailer is ready to send emails');
});

module.exports = transporter;
