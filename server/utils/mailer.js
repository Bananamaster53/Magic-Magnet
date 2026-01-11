const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Debug: Szerver indításakor látni fogod, ha betöltődött
console.log("📧 Mailer modul betöltve.");

module.exports = transporter;