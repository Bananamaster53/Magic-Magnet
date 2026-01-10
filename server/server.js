// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // 1. Kell a Node.js beépített szervere
const { Server } = require('socket.io'); // 2. Socket.io importálása

const magnetRoutes = require('./routes/magnetRoutes');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = 5000;

app.use(cors({
  origin: "*", // Teszt idejére mindenkit engedjünk be
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "x-auth-token"]
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));

// --- SOCKET.IO BEÁLLÍTÁSA ---
const server = http.createServer(app); // Az app-ot becsomagoljuk
const io = new Server(server, {
  cors: {
    origin: "*", // Engedélyezzük minden honnan a chatet
    methods: ["GET", "POST"]
  }
});

// Ez fut le, ha valaki csatlakozik a chathez
io.on("connection", (socket) => {
  console.log(`⚡ Új chat kapcsolat: ${socket.id}`);

  // Ha üzenet érkezik a klienstől
  socket.on("send_message", (data) => {
    // Visszaküldjük mindenkinek (így látja az Admin és a User is)
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
  .catch(err => console.log(err));

// Útvonalak
app.use('/api/magnets', magnetRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Fontos: server.listen, NEM app.listen!
server.listen(PORT, () => {
  console.log(`🚀 Szerver (és Chat) fut: http://localhost:${PORT}`);
});