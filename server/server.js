require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// --- NODEMAILER IMPORT (Külső fájlból) ---
const transporter = require('./utils/mailer'); 

// Modellek
const Magnet = require('./models/Magnet'); 
const Order = require('./models/Order'); 

// Útvonalak és Middleware
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

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'magnes_shop',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage: storage });

// --- ÚTVONALAK ---

// 1. MÁGNES FELTÖLTÉS
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
    res.status(500).json({ message: err.message });
  }
});

// 2. RENDELÉS LEADÁS + E-MAIL
app.post('/api/orders', auth, upload.array('customImages', 10), async (req, res) => {
  try {
    const orderInfo = JSON.parse(req.body.orderData);
    const uploadedImages = req.files ? req.files.map(file => file.path) : [];

    // --- HIÁNYZÓ VÁLTOZÓ DEFINIÁLÁSA ---
    const isTransfer = orderInfo.paymentMethod === 'bank_transfer';

    const newOrder = new Order({
      ...orderInfo,
      user: req.user.id,
      customImages: uploadedImages
    });

    const savedOrder = await newOrder.save();

    // E-MAIL ÖSSZEÁLLÍTÁSA
    const mailOptions = {
      from: `"Magic Magnet Hungary" <${process.env.EMAIL_USER}>`,
      to: orderInfo.customerDetails.email,
      subject: `Rendelés visszaigazolás - #${savedOrder._id.toString().slice(-6)}`,
      html: `
        <h1>Köszönjük a rendelésed, ${orderInfo.customerDetails.name}!</h1>
        <p>Fizetési mód: <strong>${isTransfer ? 'Banki átutalás' : 'Utánvét (fizetés a futárnál)'}</strong></p>
        <hr />
        ${isTransfer ? `
          <h3>💳 Fizetési információk (Átutalás)</h3>
          <p>Kérjük, utald el az összeget az alábbi adatokkal:</p>
          <div style="background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0;">
            <strong>Név:</strong> Magyari Máté <br />
            <strong>Számlaszám:</strong> 11700000-00000000-00000000 <br />
            <strong>Összeg:</strong> ${orderInfo.totalAmount} Ft <br />
            <strong>Közlemény:</strong> #${savedOrder._id.toString().slice(-6)}
          </div>
        ` : `
          <p>A rendelésedet rögzítettük. A végösszeget (<strong>${orderInfo.totalAmount} Ft</strong>) a futárnál tudod majd rendezni készpénzzel vagy kártyával.</p>
        `}
      `
    };

    // E-mail küldése
    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error("❌ E-mail hiba:", err);
        else console.log("📧 Visszaigazoló e-mail elküldve:", info.response);
    });

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Rendelési hiba:", err);
    res.status(500).json({ message: "Hiba a rendelés feldolgozásakor" });
  }
});

app.use('/api/magnets', require('./routes/magnetRoutes')); 
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket", "polling"]
});

io.on("connection", (socket) => {
  socket.on("send_message", (data) => {
    io.emit("receive_message", data);
  });
});

// Adatbázis
const db = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/webshop';
mongoose.connect(db)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error("❌ DB Hiba:", err));

server.listen(PORT, () => {
  console.log(`🚀 Szerver fut a ${PORT} porton`);
});