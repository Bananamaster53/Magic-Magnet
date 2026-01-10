// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'szupertitkosmágneskulcs123'; // Ugyanaz, mint az authRoutes-ban!

module.exports = function(req, res, next) {
  // 1. Token kiolvasása a fejlécből (header)
  const token = req.header('x-auth-token');

  // 2. Ha nincs token, elutasítjuk
  if (!token) {
    return res.status(401).json({ message: 'Nincs token, hozzáférés megtagadva!' });
  }

  // 3. Token ellenőrzése
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Elmentjük a felhasználó adatait a kérésbe
    next(); // Továbbengedjük a kérést
  } catch (err) {
    res.status(401).json({ message: 'Érvénytelen token!' });
  }
};