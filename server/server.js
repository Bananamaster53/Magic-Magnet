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

// Útvonalak és Middleware
const authRoutes = require('./routes/authRoutes');
const auth = require('./middleware/auth');
const orderRoutes = require('./routes/orderRoutes');

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
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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

// 1. MÁGNES FELTÖLTÉS (isFeatured alapértelmezett értéke a modellben van, de itt is kezelhető)
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

// 2. RENDELÉS LEADÁS
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

    const mailOptions = {
      to: orderInfo.customerDetails.email,
      subject: `Rendelés visszaigazolás - #${savedOrder._id.toString().slice(-6)}`,
      html: `<h1>Köszönjük a rendelésed!</h1>` // Rövidítve a példa kedvéért
    };

    transporter.sendMail(mailOptions); 
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ message: "Hiba a rendelésnél" });
  }
});

app.use('/api/magnets', require('./routes/magnetRoutes')); 
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// --- JAVÍTOTT PRIVÁT CHAT LOGIKA (SOCKET.IO) ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  transports: ['polling', 'websocket'],
  allowEIO3: true
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Belépés egy szobába (A szoba neve a felhasználó egyedi ID-ja lesz)
  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log(`User ${socket.id} joined room: ${userId}`);
  });

  // Üzenetküldés kezelése
  socket.on("send_message", (data) => {
    // data: { senderId, receiverId, author, message, time, isAdmin }
    
    // Ha az admin küldi: a cél a felhasználó szobája (receiverId = userId)
    // Ha a felhasználó küldi: a cél a saját szobája (hogy az admin is lássa, aki szintén rá van csatlakozva)
    const room = data.isAdmin ? data.receiverId : data.senderId;
    
    io.to(room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Adatbázis és Szerver indítás
const db = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/webshop';
mongoose.connect(db)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error("❌ DB Hiba:", err));

server.listen(PORT, () => {
  console.log(`🚀 Szerver fut a ${PORT} porton`);
});