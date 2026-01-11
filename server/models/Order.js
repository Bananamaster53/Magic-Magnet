// server/models/Order.js
const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  customerDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    // INNEN TÖRÖLD KI!
  },

  // IDE TEDD BE (Fő szintre):
  customImages: [{ type: String }],

  products: [
    {
      magnet: { type: mongoose.Schema.Types.ObjectId, ref: 'Magnet' },
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  
  shippingAddress: { type: String, required: true },
  note: { type: String }, // Megjegyzés

  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['bank_transfer', 'cash_on_delivery'] 
  },
  
  totalAmount: Number,
  shippingCost: Number,
  
  status: { 
    type: String, 
    default: 'Feldolgozás alatt',
    enum: ['Feldolgozás alatt', 'Csomagolás', 'Szállítás alatt', 'Teljesítve', 'Törölve'] 
  },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);