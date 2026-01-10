// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Modellek importálása (Fontos, hogy itt legyen!)
const Magnet = require('./models/Magnet'); 

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware-ek
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "x-auth-token"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cloudinary konfiguráció
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer + Cloudinary tárhely beállítása
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'magnes_shop',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// --- ÚTVONALAK ---

// 1. Mágnes feltöltés (Cloudinary-val) - Ezt ide tesszük, hogy biztosan ezt használja!
app.post('/api/magnets', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Kép feltöltése kötelező!" });
    }

    const newMagnet = new Magnet({
      name,
      price,
      description,
      imageUrl: req.file.path // Ez lesz a Cloudinary URL-je (https://...)
    });

    await newMagnet.save();
    console.log("Sikeres feltöltés a felhőbe:", req.file.path);
    res.status(201).json(newMagnet);
  } catch (err) {
    console.error("Feltöltési hiba:", err);
    res.status(500).json({ message: err.message });
  }
});

// A többi mágnes útvonalat (GET, DELETE) még mindig a routes-ból hívjuk
app.use('/api/magnets', require('./routes/magnetRoutes')); 
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Socket.io beállítása
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Élesben ide írhatod majd a Netlify címedet
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"] // Mindkét módot engedélyezzük
});

io.on("connection", (socket) => {
  console.log(`⚡ Új chat kapcsolat: ${socket.id}`);
  socket.on("send_message", (data) => {
    io.emit("receive_message", data);
  });
  socket.on("disconnect", () => {
    console.log("User kilépett", socket.id);
  });
});

// Adatbázis
const db = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/webshop';
mongoose.connect(db)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error("DB Hiba:", err));

server.listen(PORT, () => {
  console.log(`🚀 Szerver fut a ${PORT} porton`);
});