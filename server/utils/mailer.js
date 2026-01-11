// server/utils/mailer.js
const axios = require('axios');

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: "Magic Magnet Hungary", email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent
    }, {
      headers: {
        'api-key': process.env.EMAIL_PASS, // Itt a Brevo API kulcsod legyen!
        'Content-Type': 'application/json'
      }
    });
    console.log("✅ API-n keresztül elküldve! ID:", response.data.messageId);
    return response.data;
  } catch (error) {
    console.error("❌ API küldési hiba:", error.response ? error.response.data : error.message);
    throw error;
  }
};

// Mivel eddig transporter-t használtunk, egy kis trükkel kompatibilissé tesszük
module.exports = {
  sendMail: (options, callback) => {
    sendEmail(options.to, options.subject, options.html)
      .then(info => callback(null, info))
      .catch(err => callback(err));
  }
};