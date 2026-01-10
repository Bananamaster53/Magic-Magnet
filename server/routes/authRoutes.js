// server/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');      // Titkosító
const jwt = require('jsonwebtoken');     // Token gyártó

// JWT Titkos kulcs (Élesben ezt .env fájlba rejtjük, de most jó így)
const JWT_SECRET = 'szupertitkosmágneskulcs123'; 

// --- 1. REGISZTRÁCIÓ (POST /api/auth/register) ---
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Megnézzük, létezik-e már az email
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Ez az email már foglalt!" });

    // Jelszó titkosítása (ne olvasható szöveg legyen az adatbázisban)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Új felhasználó létrehozása
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: "Sikeres regisztráció!" });

  } catch (err) {
    res.status(500).json({ message: "Hiba a regisztrációnál: " + err.message });
  }
});

// --- 2. BELÉPÉS (POST /api/auth/login) ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Keresés email alapján
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Hibás email vagy jelszó!" });

    // 2. Jelszó összehasonlítása (a titkosított verzióval)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Hibás email vagy jelszó!" });

    // 3. Token generálása (Ez a 'belépőkártya')
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin }, // Mit rejtünk a kártyába?
      JWT_SECRET,
      { expiresIn: '1h' } // 1 óráig érvényes
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