require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// --- NODEMAILER IMPORT ---
const transporter = require('./utils/mailer'); 

// Modellek
const Magnet = require('./models/Magnet'); 
const Order = require('./models/Order'); 

// Auth import (csak ez marad külső fájlban, mert ez bonyolultabb)
const authRoutes = require('./routes/authRoutes');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS BEÁLLÍTÁSOK ---
const allowedOrigins = [
  'https://magic-magnet-f22iik2mu-bananamaster53s-projects.vercel.app',
  'https://magic-magnet-qrt8foimv-bananamaster53s-projects.vercel.app',
  'http://localhost:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    const isVercel = origin && origin.endsWith('.vercel.app');
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || isVercel) {
      callback(null, true);
    } else {
      console.log("❌ Tiltott Origin:", origin);
      callback(new Error('CORS hiba: Nem engedélyezett origin!'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: { folder: 'magnes_shop', allowed_formats: ['jpg', 'png', 'jpeg'] },
});
const upload = multer({ storage: storage });

// ================= ÚTVONALAK (MINDEN EGY HELYEN) =================

// --- 1. MÁGNES KEZELÉS ---

// Lekérdezés (Publikus)
app.get('/api/magnets', async (req, res) => {
  try {
    const magnets = await Magnet.find();
    res.json(magnets);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Feltöltés (Admin)
app.post('/api/magnets', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    if (!req.file) return res.status(400).json({ message: "Kép feltöltése kötelező!" });

    const newMagnet = new Magnet({
      name, price, description, imageUrl: req.file.path 
    });
    await newMagnet.save();
    res.status(201).json(newMagnet);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Szerkesztés (Admin) - JAVÍTVA: Képcsere nélkül is működik!
app.put('/api/magnets/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    const magnet = await Magnet.findById(req.params.id);
    if (!magnet) return res.status(404).json({ message: "Nincs ilyen termék" });

    magnet.name = name;
    magnet.price = price;
    magnet.description = description;
    if (req.file) magnet.imageUrl = req.file.path; // Csak ha van új kép

    await magnet.save();
    res.json(magnet);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Kiemelés (Admin)
app.patch('/api/magnets/:id', auth, async (req, res) => {
  try {
    const magnet = await Magnet.findById(req.params.id);
    if (req.body.isFeatured !== undefined) magnet.isFeatured = req.body.isFeatured;
    await magnet.save();
    res.json(magnet);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Törlés (Admin)
app.delete('/api/magnets/:id', auth, async (req, res) => {
  try {
    await Magnet.findByIdAndDelete(req.params.id);
    res.json({ message: "Törölve" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});


// --- 2. RENDELÉS KEZELÉS ---

// Rendelés leadása (Publikus/User)
app.post('/api/orders', auth, upload.array('customImages', 10), async (req, res) => {
  try {
    const orderInfo = JSON.parse(req.body.orderData);
    const uploadedImages = req.files ? req.files.map(file => file.path) : [];
    const isTransfer = orderInfo.paymentMethod === 'bank_transfer';

    const newOrder = new Order({
      ...orderInfo,
      user: req.user.id,
      customImages: uploadedImages
    });

    const savedOrder = await newOrder.save();

    // Email küldés
    const mailOptions = {
      to: orderInfo.customerDetails.email,
      from: `"Magic Magnet Hungary" <${process.env.EMAIL_USER}>`,
      subject: `Rendelés visszaigazolás - #${savedOrder._id.toString().slice(-6)}`,
      html: `<h1>Köszönjük a rendelésed! Azonosító: #${savedOrder._id.toString().slice(-6)}</h1>`
    };
    transporter.sendMail(mailOptions); 

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Rendelési hiba:", err);
    res.status(500).json({ message: "Hiba a rendeléskor" });
  }
});

// Rendelések listázása (Admin) - EZ HIÁNYZOTT, AZÉRT TŰNTEK EL!
app.get('/api/orders/all', auth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Státusz frissítése (Admin)
app.put('/api/orders/:id/status', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Nincs ilyen rendelés" });
    order.status = req.body.status;
    await order.save();
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Rendelés törlése (Admin)
app.delete('/api/orders/:id', auth, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Rendelés törölve" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- AUTH ROUTE ---
app.use('/api/auth', authRoutes);


// --- SOCKET.IO CHAT ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

io.on("connection", (socket) => {
  socket.on("join_room", (roomId) => {
    if (roomId) socket.join(roomId);
  });

  socket.on("send_message", (data) => {
    const room = data.isAdmin ? data.receiverId : data.senderId;
    if (room) {
      io.to(room).emit("receive_message", data);
      if (!data.isAdmin) io.emit("admin_notification", data); 
    }
  });
});

// DB Csatlakozás
const db = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/webshop';
mongoose.connect(db)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error("❌ DB Hiba:", err));

server.listen(PORT, () => {
  console.log(`🚀 Szerver fut a ${PORT} porton`);
});