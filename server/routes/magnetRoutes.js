// server/routes/magnetRoutes.js
const express = require('express');
const router = express.Router();
const Magnet = require('../models/Magnet');
// Feltételezve, hogy van auth middleware-ed a védelemhez
// const auth = require('../middleware/auth'); 

// 1. LEKÉRÉS (Változatlan)
router.get('/', async (req, res) => {
  try {
    const magnets = await Magnet.find();
    res.json(magnets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. SZERKESZTÉS (PUT)
router.put('/:id', async (req, res) => {
  try {
    const magnet = await Magnet.findById(req.params.id);
    if (!magnet) return res.status(404).json({ message: "Nincs ilyen termék" });

    magnet.name = req.body.name || magnet.name;
    magnet.price = req.body.price || magnet.price;
    magnet.description = req.body.description || magnet.description;

    if (req.file) {
      magnet.imageUrl = req.file.path; 
    }

    const updatedMagnet = await magnet.save();
    res.json(updatedMagnet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- ÚJ: KIEMELÉS MÓDOSÍTÁSA (PATCH) ---
// Ezt a részt adtuk hozzá a főoldali kezeléshez
router.patch('/:id', async (req, res) => {
  try {
    const magnet = await Magnet.findById(req.params.id);
    if (!magnet) return res.status(404).json({ message: "Nincs ilyen termék" });

    // Csak az isFeatured mezőt frissítjük az admin kérése alapján
    if (req.body.isFeatured !== undefined) {
      magnet.isFeatured = req.body.isFeatured;
    }

    const updatedMagnet = await magnet.save();
    res.json(updatedMagnet);
  } catch (err) {
    res.status(500).json({ message: "Hiba a kiemelés módosításakor: " + err.message });
  }
});

// 3. TÖRLÉS
router.delete('/:id', async (req, res) => {
  try {
    await Magnet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Törölve' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;