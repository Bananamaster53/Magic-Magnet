// server/routes/magnetRoutes.js
const express = require('express');
const router = express.Router();
const Magnet = require('../models/Magnet');
const multer = require('multer'); // ÚJ IMPORT
const path = require('path');

// --- MULTER BEÁLLÍTÁSA (Fájlok tárolása) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Hova mentse?
  },
  filename: function (req, file, cb) {
    // Mi legyen a neve? (Pl: datum-eredetinev.jpg)
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 1. LEKÉRÉS (Változatlan)
router.get('/', async (req, res) => {
  try {
    const magnets = await Magnet.find();
    res.json(magnets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. LÉTREHOZÁS (POST) - MOST MÁR FÁJLT IS VÁR!
// Az 'upload.single("image")' kezeli a feltöltést
router.post('/', upload.single('image'), async (req, res) => {
  console.log("📝 Új termék kérés érkezett...");
  
  // Ha van feltöltött fájl, akkor annak az útvonalát mentjük, 
  // ha nincs, akkor a placeholder képet.
  // Fontos: Windows-on a perjeleket (\) cserélni kell (/)-re a böngésző miatt
  let imagePath = "";
  if (req.file) {
    imagePath = "http://localhost:5000/" + req.file.path.replace(/\\/g, "/"); 
    // Ha IP címmel használod, itt dinamikusan kellene kezelni, de teszthez jó így.
  } else {
    imagePath = "https://placehold.co/400?text=Nincs+Kep";
  }

  const magnet = new Magnet({
    name: req.body.name,
    price: req.body.price,
    imageUrl: imagePath, // A fájl elérési útja
    description: req.body.description
  });

  try {
    const newMagnet = await magnet.save();
    res.status(201).json(newMagnet);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    // 1. Megkeressük, mit akarunk szerkeszteni
    const magnet = await Magnet.findById(req.params.id);
    if (!magnet) return res.status(404).json({ message: "Nincs ilyen termék" });

    // 2. Frissítjük az adatokat
    magnet.name = req.body.name || magnet.name;
    magnet.price = req.body.price || magnet.price;
    magnet.description = req.body.description || magnet.description;

    // 3. Kép kezelése: Csak akkor írjuk felül, ha jött új fájl!
    if (req.file) {
      // Windows perjelek cseréje, pont mint a POST-nál
      magnet.imageUrl = "http://localhost:5000/" + req.file.path.replace(/\\/g, "/");
    }

    // 4. Mentés
    const updatedMagnet = await magnet.save();
    res.json(updatedMagnet);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. TÖRLÉS (Változatlan)
router.delete('/:id', async (req, res) => {
  try {
    await Magnet.findByIdAndDelete(req.params.id);
    res.json({ message: 'Törölve' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;