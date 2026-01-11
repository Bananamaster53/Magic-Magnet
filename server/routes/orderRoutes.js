// server/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const transporter = require('../utils/mailer');
const Order = require('../models/Order');

// --- TÖRÖLD KI A POST ÚTVONALAT INNEN, MERT A SERVER.JS-BEN VAN! ---

// 1. SAJÁT RENDELÉSEK (GET /mine)
// Fontos, hogy ez legyen elől!
router.get('/mine', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. ÖSSZES RENDELÉS (ADMIN) (GET /all)
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

// 3. STÁTUSZ FRISSÍTÉS (PUT)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'email username');

    if (!updatedOrder) return res.status(404).json({ message: 'Nincs ilyen rendelés' });

    // --- ÁLLAPOTVÁLTOZÁS E-MAIL ---
    const statusMessages = {
      'processing': 'feldolgozás alatt áll',
      'shipped': 'átadva a futárszolgálatnak',
      'completed': 'sikeresen kézbesítve',
      'cancelled': 'törölve lett'
    };

    const mailOptions = {
      from: `"Magic Magnet Hungary" <${process.env.EMAIL_USER}>`,
      to: updatedOrder.customerDetails.email, // vagy updatedOrder.user.email
      subject: `Rendelésed állapota frissült: ${status}`,
      html: `
        <h2>Kedves ${updatedOrder.customerDetails.name}!</h2>
        <p>Tájékoztatunk, hogy a <strong>#${updatedOrder._id.toString().slice(-6)}</strong> számú rendelésed állapota megváltozott.</p>
        <p>Új állapot: <strong style="color: #2563eb;">${statusMessages[status] || status}</strong></p>
        <p>Köszönjük, hogy minket választottál!</p>
      `
    };

    transporter.sendMail(mailOptions);

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 4. TÖRLÉS (DELETE)
router.delete('/:id', auth, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Törölve" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;