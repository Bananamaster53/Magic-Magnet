// server/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // Az 587-es portnál false kell
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Itt a Brevo API kulcsod lesz
  },
  tls: {
    rejectUnauthorized: false
  }
});

module.exports = transporter;