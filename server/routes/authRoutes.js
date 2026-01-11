const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transporter = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'szupertitkosmágneskulcs123'; 

// --- 1. REGISZTRÁCIÓ ---
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Ez az email már foglalt!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    // E-MAIL KÜLDÉSE (A mentés után!)
    const mailOptions = {
      from: `"Magic Magnet Hungary" <${process.env.EMAIL_USER}>`,
      to: newUser.email,
      subject: 'Üdvözöljük a Magic Magnet Hungary-nél!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #2563eb;">Kedves ${newUser.username}!</h2>
          <p>Sikeresen regisztráltál a <strong>Magic Magnet Hungary</strong> webshopba.</p>
          <p>Mostantól leadhatod egyedi hűtőmágnes rendeléseidet és nyomon követheted őket a profilodban.</p>
          <br />
          <p>Üdvözlettel,<br>A Magic Magnet csapata</p>
        </div>
      `
    };

    // Küldés hibaellenőrzéssel (nem állítja meg a regisztrációt, ha az e-mail elakad)
    console.log("🚀 Kísérlet az e-mail küldésére a Brevón keresztül...");

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("❌ Regisztrációs e-mail hiba a szerveren:", err); // Itt fogod látni, ha mégis timeout lenne
      } else {
        console.log("✅ E-mail sikeresen átadva a Brevónak!");
        console.log("Message ID:", info.messageId); // A Brevo azonosítója
        console.log("Válasz:", info.response);     // "250 OK" üzenet
      }
    });

    res.status(201).json({ message: "Sikeres regisztráció!" });

  } catch (err) {
    console.error("Hiba a regisztrációs folyamatban:", err);
    res.status(500).json({ message: "Hiba a regisztrációnál: " + err.message });
  }
});

// --- 2. BELÉPÉS ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Hibás email vagy jelszó!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Hibás email vagy jelszó!" });

    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ 
      token, 
      user: { id: user._id, username: user.username, isAdmin: user.isAdmin } 
    });

  } catch (err) {
    res.status(500).json({ message: "Hiba a belépésnél: " + err.message });
  }
});

module.exports = router;