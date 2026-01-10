// server/routes/magnetRoutes.js
const express = require('express');
const router = express.Router();
const Magnet = require('../models/Magnet');

// 1. LEKÉRÉS (Változatlan)
router.get('/', async (req, res) => {
  try {
    const magnets = await Magnet.find();
    res.json(magnets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FIGYELEM: A POST (Létrehozás) részt innen TÖRÖLTÜK, 
// mert a server.js-ben lévő verzió kezeli a Cloudinary-t!

// 2. SZERKESZTÉS (PUT) - Frissítve a felhőhöz
router.put('/:id', async (req, res) => {
  try {
    const magnet = await Magnet.findById(req.params.id);
    if (!magnet) return res.status(404).json({ message: "Nincs ilyen termék" });

    magnet.name = req.body.name || magnet.name;
    magnet.price = req.body.price || magnet.price;
    magnet.description = req.body.description || magnet.description;

    // Ha jön új kép (Cloudinary-ról a server.js-en keresztül)
    if (req.file) {
      magnet.imageUrl = req.file.path; 
    }

    const updatedMagnet = await magnet.save();
    res.json(updatedMagnet);
  } catch (err) {
    res.status(500).json({ message: err.message });
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