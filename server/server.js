require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Modellek importálása
const Magnet = require('./models/Magnet'); 
const Order = require('./models/Order'); // Beimportálva a rendeléshez

const authRoutes = require('./routes/authRoutes');
const auth = require('./middleware/auth');
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

// 1. MÁGNES FELTÖLTÉS (Admin oldalról, egyetlen kép)
app.post('/api/magnets', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    if (!req.file) return res.status(400).json({ message: "Kép feltöltése kötelező!" });

    const newMagnet = new Magnet({
      name,
      price,
      description,
      imageUrl: req.file.path 
    });

    await newMagnet.save();
    res.status(201).json(newMagnet);
  } catch (err) {
    console.error("Mágnes feltöltési hiba:", err);
    res.status(500).json({ message: err.message });
  }
});

// 2. RENDELÉS LEADÁS (Vásárló oldali, TÖBB egyedi kép)
app.post('/api/orders', auth, upload.array('customImages', 10), async (req, res) => {
  try {
    const orderInfo = JSON.parse(req.body.orderData);
    const uploadedImages = req.files ? req.files.map(file => file.path) : [];

    const newOrder = new Order({
      ...orderInfo,
      user: req.user.id, // EZ A KULCS: összeköti a rendelést a userrel
      customImages: uploadedImages
    });

    await newOrder.save();
    console.log("Sikeres rendelés mentve a felhasználóhoz:", req.user.id);
    res.status(201).json(newOrder);
  } catch (err) {
    console.error("Rendelés mentési hiba:", err);
    res.status(500).json({ message: "Hiba a rendelés feldolgozásakor." });
  }
});

// Alapértelmezett útvonalak a többi funkciónak (GET, DELETE, AUTH)
app.use('/api/magnets', require('./routes/magnetRoutes')); 
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Socket.io (Chat) beállítása
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"]
});

io.on("connection", (socket) => {
  console.log(`⚡ Új chat kapcsolat: ${socket.id}`);
  socket.on("send_message", (data) => {
    io.emit("receive_message", data);
  });
  socket.on("disconnect", () => console.log("User kilépett", socket.id));
});

// Adatbázis csatlakozás
const db = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/webshop';
mongoose.connect(db)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error("❌ DB Hiba:", err));

server.listen(PORT, () => {
  console.log(`🚀 Szerver fut a ${PORT} porton`);
});