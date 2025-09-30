const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false, // TLS with port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify((err, success) => {
  if (err) console.error('❌ Mailer verify error:', err);
  else console.log('✅ Mailer is ready ');
});

module.exports = transporter;
