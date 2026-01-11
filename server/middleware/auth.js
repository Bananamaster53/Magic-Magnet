// server/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // 1. Token kiolvasása a fejlécből
  const token = req.header('x-auth-token');

  // 2. Ha nincs token, elutasítjuk
  if (!token) {
    return res.status(401).json({ message: 'Nincs token, hozzáférés megtagadva!' });
  }

  try {
    // 3. Token ellenőrzése a környezeti változóval (vagy fallback a titkos kulcsra)
    const secret = process.env.JWT_SECRET || 'szupertitkosmágneskulcs123'; 
    const decoded = jwt.verify(token, secret);
    
    req.user = decoded; 
    next(); 
  } catch (err) {
    // Ha a token lejárt vagy módosították, 401-et küldünk vissza
    res.status(401).json({ message: 'Érvénytelen vagy lejárt token!' });
  }
};