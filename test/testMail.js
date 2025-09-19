const transporter = require('../utils/mailer');

(async () => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test Email',
      text: 'Hello from backend!'
    });
    console.log('✅ Email sent successfully');
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();


// ================================================================================ //
// Check the other files for recent edits.
// node test/testMail.js