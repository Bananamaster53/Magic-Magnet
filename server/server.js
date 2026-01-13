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

// --- DINAMIKUS CORS BEÁLLÍTÁSOK ---
// Megoldja a Vercel-es "Nem engedélyezett origin" hibákat
const allowedOrigins = [
  'https://magic-magnet-f22iik2mu-bananamaster53s-projects.vercel.app',
  'https://magic-magnet-qrt8foimv-bananamaster53s-projects.vercel.app',
  'http://localhost:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Engedélyezzük, ha benne van a listában, vagy ha Vercel-es aldomain, vagy ha localhost
    const isVercel = origin && origin.endsWith('.vercel.app');
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || isVercel) {
      callback(null, true);
    } else {
      console.log("❌ Tiltott Origin próbálkozott:", origin);
      callback(new Error('CORS hiba: Nem engedélyezett origin!'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // PATCH engedélyezve a csillagozáshoz
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

// 2. MÁGNES SZERKESZTÉSE (PUT) - EZT ILLESD BE!
app.put('/api/magnets/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, price, description } = req.body;
    
    // Megkeressük a terméket az ID alapján
    const magnet = await Magnet.findById(req.params.id);
    if (!magnet) return res.status(404).json({ message: "A termék nem található" });

    // Frissítjük az adatokat
    magnet.name = name;
    magnet.price = price;
    magnet.description = description;

    // Ha töltöttek fel ÚJ képet, akkor lecseréljük.
    // Ha nem (req.file undefined), akkor marad a régi (magnet.imageUrl).
    if (req.file) {
      magnet.imageUrl = req.file.path;
    }

    await magnet.save();
    res.json(magnet);
  } catch (err) {
    console.error("Szerkesztési hiba:", err);
    res.status(500).json({ message: err.message });
  }
});

// 3. MÁGNES TÖRLÉSE (DELETE) - EZ IS HASZNOS, HA MÉG NINCS
app.delete('/api/magnets/:id', async (req, res) => {
  try {
    await Magnet.findByIdAndDelete(req.params.id);
    res.json({ message: "Termék törölve" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. RENDELÉS LEADÁS + E-MAIL
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
      from: `"Magic Magnet Hungary" <${process.env.EMAIL_USER}>`,
      subject: `Rendelés visszaigazolás - #${savedOrder._id.toString().slice(-6)}`,
      html: `
        <h1>Köszönjük a rendelésed, ${orderInfo.customerDetails.name}!</h1>
        <p>Rendelés azonosító: <strong>#${savedOrder._id.toString().slice(-6)}</strong></p>
        <p>Fizetési mód: <strong>${isTransfer ? 'Banki átutalás' : 'Utánvét'}</strong></p>
        <hr />
        ${isTransfer ? `
          <h3>💳 Fizetési információk</h3>
          <p>Név: Mátés Marcell | Számlaszám: 11773432-01615449 | Összeg: ${orderInfo.totalAmount} Ft</p>
        ` : `<p>A végösszeget (${orderInfo.totalAmount} Ft) a futárnál tudod rendezni.</p>`}
      `
    };

    transporter.sendMail(mailOptions); 
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Rendelési hiba:", err);
    res.status(500).json({ message: "Hiba a rendelés feldolgozásakor" });
  }
});

app.use('/api/magnets', require('./routes/magnetRoutes')); 
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// --- PRIVÁT CHAT LOGIKA (SOCKET.IO) ---
// Kezeli a vendégeket, az admint és a szétcsúszás-mentes kommunikációt
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
  transports: ['polling', 'websocket'], // Stabilitás a Renderen
  allowEIO3: true
});

io.on("connection", (socket) => {
  // Belépés a szobába (userId vagy guestId alapján)
  socket.on("join_room", (roomId) => {
    if (roomId) {
      socket.join(roomId);
      console.log(`Socket ${socket.id} belépett a szobába: ${roomId}`);
    }
  });

  // Üzenetküldés kezelése
  socket.on("send_message", (data) => {
    // Meghatározzuk a cél szobát (vagy a júzeré, vagy a vendégé)
    const room = data.isAdmin ? data.receiverId : data.senderId;
    
    if (room) {
      // Csak az adott szobában lévők kapják meg
      io.to(room).emit("receive_message", data);
      
      // Ha nem admin küldte, dobunk egy globális jelzést az admin felületnek
      if (!data.isAdmin) {
        io.emit("admin_notification", data); 
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
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