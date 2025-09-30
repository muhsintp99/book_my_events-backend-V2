const transporter = require('./mailer');

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"BookMyEvent" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to} ✅`);
  } catch (err) {
    console.error('Email sending failed:', err.message);
    throw err;
  }
};

module.exports = sendEmail;
