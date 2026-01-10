// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true }, // unique: nem lehet két azonos email
  password: { type: String, required: true },
  isAdmin:  { type: Boolean, default: false } // Alapból mindenki vásárló
});

module.exports = mongoose.model('User', userSchema);