// server/models/Magnet.js
const mongoose = require('mongoose');

const magnetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  imageUrl: String,
  stock: { type: Number, default: 10 }
});

// FONTOS: Ez a sor szokott hiányozni vagy hibás lenni!
module.exports = mongoose.model('Magnet', magnetSchema);