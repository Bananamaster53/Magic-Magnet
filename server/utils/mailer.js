// server/utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true a 465-ös porthoz, false minden más porthoz
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    // Ez segít, ha a tanúsítvány ellenőrzése akadályozná a kapcsolatot
    rejectUnauthorized: false 
  },
  connectionTimeout: 10000, // 10 másodperc várakozás a kapcsolatra
});

module.exports = transporter;