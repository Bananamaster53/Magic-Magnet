// server/utils/mailer.js
const axios = require('axios');

const sendMail = async (options) => {
  try {
    const { to, subject, html } = options;
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: "Magic Magnet Hungary", email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html
    }, {
      headers: {
        'api-key': process.env.EMAIL_PASS,
        'Content-Type': 'application/json'
      }
    });
    console.log("✅ API-n keresztül elküldve! ID:", response.data.messageId);
    return response.data;
  } catch (error) {
    // Részletes hiba naplózás, hogy lássuk ha az API kulcs a rossz
    const errorData = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error("❌ Brevo API hiba:", errorData);
  }
};

// Csak a függvényt exportáljuk objektumként
module.exports = { sendMail };