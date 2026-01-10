import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { API_URL } from './config';

import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import About from './pages/About';
import Shipping from './pages/Shipping';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

import ChatWidget from './components/ChatWidget';
import './App.css';

function App() {
  const [magnets, setMagnets] = useState([]);
  const [customImages, setCustomImages] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ÚJ: Betöltési állapot

  const [shippingData, setShippingData] = useState({ zip: '', city: '', street: '', details: '' });
  const [contactData, setContactData] = useState({ name: '', email: '', phone: '' });
  const [orderNote, setOrderNote] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const shippingCost = 990;
  const placeholderImg = "https://placehold.co/100?text=...";

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const productsTotal = cartTotal;
  const finalTotal = productsTotal + shippingCost;

  useEffect(() => {
    // 1. Felhasználó visszaállítása LocalStorage-ból
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      const u = JSON.parse(storedUser);
      setUser(u);
      setContactData({ email: u.email, name: u.username, phone: '' });
    }
    
    // Jelezzük, hogy az alapvető user ellenőrzés megvolt
    setLoading(false);

    // 2. Termékek lekérése
    axios.get(`${API_URL}/magnets`)
      .then(res => setMagnets(res.data))
      .catch(err => console.error("Hiba a termékek betöltésekor:", err));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.info("Sikeres kijelentkezés!");
    // Itt nem kell window.location.href, a React Router megoldja
  };

  // --- KOSÁR ÉS RENDELÉS FUNKCIÓK (Változatlanok maradnak) ---
  const addToCart = (magnet) => {
    const existingItem = cart.find(item => item._id === magnet._id);
    if (existingItem) {
      setCart(cart.map(item => item._id === magnet._id ? { ...item, quantity: item.quantity + 1 } : item));
      toast.info(`+1 ${magnet.name} a kosárban!`, { autoClose: 1000 });
    } else {
      setCart([...cart, { ...magnet, quantity: 1 }]);
      toast.success("Kosárba került! 🛒", { autoClose: 1000 });
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => item._id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item._id !== id));

  const startCheckout = () => {
    if (cart.length === 0) return toast.warning("Üres a kosár!");
    if (!user) return toast.error("A rendeléshez jelentkezz be!");
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleAddressChange = (e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value });
  const handleContactChange = (e) => setContactData({ ...contactData, [e.target.name]: e.target.value });

  const placeOrder = async () => {
    if (!termsAccepted) return toast.error("A rendeléshez el kell fogadnod az ÁSZF-et!");

    const formData = new FormData();
    
    // Itt állítjuk össze az adatokat közvetlenül a küldés előtt
    const orderData = {
      products: cart.map(item => ({ magnet: item._id, name: item.name, price: item.price, quantity: item.quantity })),
      totalAmount: finalTotal,
      shippingCost,
      shippingAddress: `${shippingData.zip} ${shippingData.city}, ${shippingData.street}${shippingData.details ? ', ' + shippingData.details : ''}`,
      customerDetails: contactData,
      note: orderNote
    };

    formData.append('orderData', JSON.stringify(orderData));

    if (customImages && customImages.length > 0) {
      for (let i = 0; i < customImages.length; i++) {
        formData.append('customImages', customImages[i]);
      }
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/orders`, formData, {
        headers: { 
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data' 
        }
      });

      if (response.status === 201 || response.status === 200) {
        toast.success("Rendelés sikeresen leadva! 🚀");
        setCart([]);
        setCustomImages([]);
        setIsCheckoutOpen(false);
      }
    } catch (err) {
      console.error("Hiba a küldésnél:", err);
      toast.error("Hiba történt a rendelés során!");
    }
  };

  // Várakozás, amíg a useEffect beolvassa a user-t
  if (loading) return <div className="loading-screen">Betöltés...</div>;

  return (
    <BrowserRouter>
      <div className="app">
        <ToastContainer position="bottom-right" theme="colored" />

        <nav className="navbar">
          <div className="container nav-container">
            <Link to="/" className="logo">🧲 Magic Magnet Hungary</Link>
            <div className="nav-links">
              <Link to="/">Főoldal</Link>
              {user ? (
                <>
                  <Link to="/profile">Profil</Link>
                  {user.isAdmin && <Link to="/admin" style={{color: '#f59e0b'}}>Admin</Link>}
                  <button onClick={handleLogout} className="logout-btn">Kilépés</button>
                </>
              ) : (
                <>
                  <Link to="/login">Belépés</Link>
                  <Link to="/register" className="highlight-link">Regisztráció</Link>
                </>
              )}
              <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
                🛒 <span className="badge">{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
              </button>
            </div>
          </div>
        </nav>

        <div className="main-content">
          {/* --- ITT VANNAK A ROUTE-OK BEKÖTVE --- */}
          <Routes>
             <Route path="/" element={<Home magnets={magnets} addToCart={addToCart} />} />
             <Route path="/admin" element={user && user.isAdmin ? <AdminPanel /> : <Navigate to="/login" />} />
             <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
             <Route path="/register" element={<Register />} />
             <Route path="/login" element={<Login />} />
             
             {/* ÚJ OLDALAK */}
             <Route path="/about" element={<About />} />
             <Route path="/shipping" element={<Shipping />} />
             <Route path="/privacy" element={<Privacy />} />
             <Route path="/terms" element={<Terms />} />
          </Routes>
        </div>

        <footer className="footer">
          <div className="container footer-grid">
            
            <div className="footer-col">
              <h3>🧲 Magic Magnet Hungary</h3>
              <p>Egyedi hűtőmágnesek minden alkalomra. A legjobb minőség, közvetlenül a gyártótól.</p>
            </div>

            <div className="footer-col">
              <h4>Információk</h4>
              <ul>
                {/* ÚJ: Linkek használata, hogy ne töltődjön újra az oldal */}
                <li><Link to="/about">Rólunk</Link></li>
                <li><Link to="/shipping">Szállítási információk</Link></li>
                <li><Link to="/privacy">Adatvédelmi nyilatkozat</Link></li>
                <li><Link to="/terms">Általános Szerződési Feltételek (ÁSZF)</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Kapcsolat</h4>
              <ul>
                <li>
                  <a href="https://maps.app.goo.gl/kGofgeBBSasnqxBKA" target="_blank" rel="noreferrer">
                    📍 7431 Juta, Szőlőhegy u.
                  </a>
                </li>
                <li>
                  <a href="mailto:info@magnesmester.hu">
                    📧 info@magnesmester.hu
                  </a>
                </li>
                <li>
                  <a href="tel:+36205086108">
                    📞 +36 20 508 6108
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Kövess minket</h4>
              <div className="social-icons">
                <a href="https://www.facebook.com/magicmagnethungary?locale=hu_HU" target="_blank" rel="noreferrer">Facebook</a> • 
                <a href="https://instagram.com" target="_blank" rel="noreferrer"> Instagram</a> • 
                <a href="https://www.tiktok.com/@magicmagnethungary?is_from_webapp=1&sender_device=pc" target="_blank" rel="noreferrer"> TikTok</a>
              </div>
            </div>

          </div>
          <div className="footer-bottom">
            <p>© 2024 Magic Magnet Hungary. Minden jog fenntartva.</p>
          </div>
        </footer>

        {/* --- SIDE CART --- */}
        <div className={`cart-overlay ${isCartOpen ? 'open' : ''}`} onClick={() => setIsCartOpen(false)}></div>
        <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
          <div className="cart-header">
            <h2>Kosár</h2>
            <button onClick={() => setIsCartOpen(false)} className="close-cart-btn">✕</button>
          </div>
          <div className="cart-body">
            {cart.length === 0 ? (
              <div className="empty-cart"><span style={{fontSize: '3rem'}}>🛒</span><p>Még üres a kosarad.</p></div>
            ) : (
              <div className="cart-items-list">
                {cart.map((item) => (
                  <div key={item._id} className="cart-item-row">
                    <img src={item.imageUrl || placeholderImg} alt={item.name} onError={(e) => { e.target.src = placeholderImg; }} className="cart-thumb" />
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">{item.price * item.quantity} Ft</div>
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item._id, -1)} className="qty-btn">-</button>
                        <span>{item.quantity} db</span>
                        <button onClick={() => updateQuantity(item._id, 1)} className="qty-btn">+</button>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item._id)} className="remove-item-btn">🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {cart.length > 0 && (
            <div className="cart-footer-section">
              <div className="cart-summary"><span>Részösszeg</span><span className="summary-price">{cartTotal} Ft</span></div>
              <button onClick={startCheckout} className="checkout-btn-large">Tovább a rendeléshez</button>
            </div>
          )}
        </div>

        {/* --- CHECKOUT MODAL --- */}
        {isCheckoutOpen && (
          <div className="modal-overlay">
            <div className="checkout-modal">
              <div className="checkout-header">
                <h2>🛍️ Rendelés Véglegesítése</h2>
                <button onClick={() => setIsCheckoutOpen(false)} className="close-cart-btn">✕</button>
              </div>

              <div className="checkout-body">
                
                <div className="checkout-section">
                  <h3>👤 Kapcsolattartó adatok</h3>
                  <div className="form-group">
                    <label>Teljes név</label>
                    <input type="text" name="name" value={contactData.name} onChange={handleContactChange} placeholder="Pl. Minta János" />
                  </div>
                  <div className="address-grid">
                    <div className="form-group">
                      <label>Email cím</label>
                      <input type="email" name="email" value={contactData.email} onChange={handleContactChange} placeholder="janos@email.com" />
                    </div>
                    <div className="form-group">
                      <label>Telefonszám</label>
                      <input type="tel" name="phone" value={contactData.phone} onChange={handleContactChange} placeholder="+36 30 123 4567" />
                    </div>
                  </div>
                </div>

                <div className="checkout-section">
                  <h3>📍 Szállítási adatok</h3>
                  <div className="address-grid">
                    <div className="form-group" style={{flex: '1'}}>
                      <label>Irsz.</label>
                      <input type="text" name="zip" value={shippingData.zip} onChange={handleAddressChange} placeholder="1051" />
                    </div>
                    <div className="form-group" style={{flex: '3'}}>
                      <label>Város</label>
                      <input type="text" name="city" value={shippingData.city} onChange={handleAddressChange} placeholder="Budapest" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Utca, házszám</label>
                    <input type="text" name="street" value={shippingData.street} onChange={handleAddressChange} placeholder="Kossuth Lajos utca 12." />
                  </div>
                  <div className="form-group">
                    <label>Emelet, ajtó, egyéb (opcionális)</label>
                    <input type="text" name="details" value={shippingData.details} onChange={handleAddressChange} placeholder="3. emelet, 12-es kapucsengő" />
                  </div>
                </div>

                <div className="checkout-section" style={{background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px dashed #cbd5e1'}}>
                  <h3>🖼️ Egyedi képek feltöltése</h3>
                  <p style={{fontSize: '0.85rem', color: '#64748b', marginBottom: '10px'}}>Ha egyedi képet szeretnél a mágnesre, itt töltheted fel (akár többet is).</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={(e) => setCustomImages(e.target.files)} 
                    style={{width: '100%', padding: '5px'}}
                  />
                  {customImages && customImages.length > 0 && (
                    <div style={{marginTop: '10px', color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem'}}>
                      ✅ {customImages.length} db kép kiválasztva
                    </div>
                  )}
                </div>

                <div className="checkout-section">
                   <h3>📝 Megjegyzés (opcionális)</h3>
                   <textarea rows="2" placeholder="Megjegyzés a rendeléshez..." value={orderNote} onChange={(e) => setOrderNote(e.target.value)} className="note-input"></textarea>
                </div>

                <div className="order-summary-box">
                  <h3>Összesítés</h3>
                  <ul className="summary-list">
                    {cart.map(item => (
                      <li key={item._id}>
                        <span>{item.name} x{item.quantity}</span>
                        <span>{item.price * item.quantity} Ft</span>
                      </li>
                    ))}
                    <li style={{borderTop:'1px dashed #cbd5e1', marginTop:'10px', paddingTop:'10px', color:'#64748b'}}>
                      <span>Szállítási költség (GLS)</span>
                      <span>{shippingCost} Ft</span>
                    </li>
                  </ul>
                  <div className="checkout-total">
                    Fizetendő: {productsTotal + shippingCost} Ft
                  </div>
                </div>

                <div className="legal-section">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                    <span>Elfogadom az <Link to="/terms" target="_blank">ÁSZF</Link>-et és az <Link to="/privacy" target="_blank">Adatvédelmit</Link>.</span>
                  </label>
                </div>
              </div>

              <div className="checkout-footer">
                <button onClick={() => setIsCheckoutOpen(false)} className="back-btn">Vissza</button>
                <button onClick={placeOrder} className="confirm-order-btn">
                  Rendelés Leadása ({productsTotal + shippingCost} Ft)
                </button>
              </div>
            </div>
          </div>
        )}

        <ChatWidget user={user} />
      </div>
    </BrowserRouter>
  );
}

export default App;