// server/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');

// 1. ÚJ RENDELÉS (POST)
router.post('/', auth, async (req, res) => {
  try {
    const { products, totalAmount, shippingAddress, customerDetails, shippingCost, note } = req.body;

    if (!customerDetails || !customerDetails.name || !customerDetails.email) {
      return res.status(400).json({ message: "Hiányzó adatok!" });
    }

    const newOrder = new Order({
      user: req.user.id,
      products,
      totalAmount,
      shippingAddress,
      customerDetails,
      shippingCost,
      note,
      status: 'Feldolgozás alatt'
    });

    const savedOrder = await newOrder.save();
    res.json(savedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. SAJÁT RENDELÉSEK (GET /mine) --- EZ HIÁNYZOTT! ---
router.get('/mine', auth, async (req, res) => {
  try {
    // Csak azokat a rendeléseket keressük, amik a belépett userhez tartoznak
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 3. ÖSSZES RENDELÉS (ADMIN) (GET /all)
router.get('/all', auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', ['username', 'email'])
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. STÁTUSZ FRISSÍTÉS (PUT)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!updatedOrder) return res.status(404).json({ message: 'Nincs ilyen rendelés' });
    res.json(updatedOrder); 
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. TÖRLÉS (DELETE)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Törölve" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;