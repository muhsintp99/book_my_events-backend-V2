const nodemailer = require('nodemailer');
require('dotenv').config(); // make sure this is at the top

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true,
  pool: true, // ✅ Enable pooling to prevent repetitive login failures
  maxConnections: 1, // ✅ Keep connections low for Hostinger limits
  rateDelta: 20000, // ✅ Wait 20 seconds between SMTP commands if needed
  rateLimit: 5, // ✅ Limit to 5 messags per window
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection with auto-retry for Hostinger (454 is temporary)
const verifyConnection = () => {
    transporter.verify((err, success) => {
        if (err) {
            if (err.responseCode === 454) {
                console.warn('⚠️ Mailer: Hostinger temporary rate limit (454). Retrying in 60s...');
                setTimeout(verifyConnection, 60000);
            } else {
                console.error('❌ Mailer error:', err.message);
            }
        } else {
            console.log('✅ Mailer is ready to send emails');
        }
    });
};

verifyConnection();

module.exports = transporter;
