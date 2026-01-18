import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar'; // Győződj meg róla, hogy ez a helyes elérési út!
import ChatWidget from './components/ChatWidget';
import { API_URL } from './config';

import Home from './pages/Home';
import Products from './pages/Products';
import AdminPanel from './pages/AdminPanel';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import About from './pages/About';
import Shipping from './pages/Shipping';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

import './App.css'; // Fontos a globális stílusokhoz

function App() {
  // --- ÁLLAPOTOK ---
  const [magnets, setMagnets] = useState([]);
  const [customImages, setCustomImages] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Checkout állapotok
  const [orderNote, setOrderNote] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [shippingData, setShippingData] = useState({ zip: '', city: '', street: '', details: '' });
  const [contactData, setContactData] = useState({ name: '', email: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');

  const shippingCost = 990;
  const placeholderImg = "https://placehold.co/100?text=...";

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const finalTotal = cartTotal + shippingCost;

  // --- BETÖLTÉS ÉS AUTH ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        setContactData({ email: u.email, name: u.username, phone: '' });
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);

    axios.get(`${API_URL}/magnets`)
      .then(res => setMagnets(res.data))
      .catch(err => console.error("Hiba a termékeknél:", err));
  }, []);

  const addToCart = (magnet) => {
    const existingItem = cart.find(item => item._id === magnet._id);
    if (existingItem) {
      setCart(cart.map(item => item._id === magnet._id ? { ...item, quantity: item.quantity + 1 } : item));
      toast.info(`+1 ${magnet.name}`, { autoClose: 1000 });
    } else {
      setCart([...cart, { ...magnet, quantity: 1 }]);
      toast.success("Kosárba került! 🛒", { autoClose: 1000 });
    }
    setIsCartOpen(true);
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

  const placeOrder = async () => {
    if (!termsAccepted) return toast.error("Fogadd el az ÁSZF-et!");
    if (!contactData.name || !contactData.email || !shippingData.city || !shippingData.street) {
      return toast.error("Kérlek tölts ki minden kötelező mezőt!");
    }

    const formData = new FormData();
    const orderData = {
      products: cart.map(item => ({ magnet: item._id, name: item.name, price: item.price, quantity: item.quantity })),
      totalAmount: finalTotal,
      shippingCost,
      shippingAddress: `${shippingData.zip} ${shippingData.city}, ${shippingData.street} ${shippingData.details || ''}`,
      customerDetails: contactData,
      note: orderNote,
      paymentMethod: paymentMethod
    };

    formData.append('orderData', JSON.stringify(orderData));
    if (customImages && customImages.length > 0) {
      Array.from(customImages).forEach(file => formData.append('customImages', file));
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/orders`, formData, {
        headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Rendelés sikeresen leadva! 🚀");
      setCart([]);
      setCustomImages([]);
      setIsCheckoutOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Hiba történt a rendelés során.");
    }
  };

  const handleAddressChange = (e) => setShippingData({ ...shippingData, [e.target.name]: e.target.value });
  const handleContactChange = (e) => setContactData({ ...contactData, [e.target.name]: e.target.value });

  if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>Betöltés...</div>;

  return (
    <BrowserRouter>
      {/* Fő konténer: PaddingTop a Navbar miatt, modern háttér */}
      <div className="app" style={{ 
        paddingTop: '80px', 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        fontFamily: "'Inter', sans-serif"
      }}>
        <ToastContainer position="bottom-right" theme="colored" />

        {/* --- NAVBAR --- */}
        <Navbar 
          user={user} 
          setUser={setUser} 
          cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)} 
          onCartClick={() => setIsCartOpen(true)} 
        />

        {/* --- TARTALOM --- */}
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Home magnets={magnets.filter(m => m.isFeatured)} addToCart={addToCart} />} />
            <Route path="/admin" element={user && user.isAdmin ? <AdminPanel /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/products" element={<Products magnets={magnets} addToCart={addToCart} />} />
            
            <Route path="/about" element={<About />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </div>

        {/* --- SIDE CART (Jobb oldali kosár) --- */}
        <div 
          className={`cart-overlay ${isCartOpen ? 'open' : ''}`} 
          style={{ 
            display: isCartOpen ? 'block' : 'none', 
            position: 'fixed', inset: 0, 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            backdropFilter: 'blur(3px)', 
            zIndex: 1001 
          }}
          onClick={() => setIsCartOpen(false)}
        ></div>
        
        <div 
          className={`cart-drawer ${isCartOpen ? 'open' : ''}`} 
          style={{ 
            position: 'fixed', 
            top: 0, 
            right: isCartOpen ? 0 : '-450px', 
            width: '100%', maxWidth: '420px', 
            height: '100vh', 
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            zIndex: 1002, 
            transition: 'right 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '22px' }}>🛒 Kosarad</h2>
            <button onClick={() => setIsCartOpen(false)} style={{ border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>✕</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '50px', color: '#64748b' }}>
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>🛍️</div>
                <p>Még üres a kosarad.</p>
                <button onClick={() => setIsCartOpen(false)} style={{ marginTop: '10px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Vásárlás folytatása</button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item._id} style={{ display: 'flex', gap: '15px', marginBottom: '15px', padding: '10px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', alignItems: 'center' }}>
                  <img src={item.imageUrl || placeholderImg} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{item.name}</div>
                    <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>{item.price * item.quantity} Ft</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '5px', borderRadius: '8px' }}>
                    <button onClick={() => updateQuantity(item._id, -1)} style={{ width: '25px', height: '25px', border: 'none', background: 'white', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>-</button>
                    <span style={{ fontSize: '13px', minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, 1)} style={{ width: '25px', height: '25px', border: 'none', background: 'white', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>+</button>
                  </div>
                  <button onClick={() => removeFromCart(item._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '18px', padding: '5px' }}>🗑️</button>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div style={{ padding: '25px', borderTop: '1px solid #e2e8f0', background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontWeight: 'bold', fontSize: '18px' }}>
                <span>Összesen:</span>
                <span style={{ color: '#3b82f6' }}>{cartTotal} Ft</span>
              </div>
              <button 
                onClick={startCheckout} 
                className="btn-gradient" // Használjuk a globális stílust
                style={{ width: '100%', fontSize: '16px' }}
              >
                Tovább a rendeléshez ➡
              </button>
            </div>
          )}
        </div>

        {/* --- CHECKOUT MODAL --- */}
        {isCheckoutOpen && (
          <div style={{ 
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', 
            backdropFilter: 'blur(5px)', zIndex: 2000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center' 
          }}>
            <div className="glass-panel" style={{ 
              width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
              backgroundColor: 'white', borderRadius: '20px', padding: '0', 
              display: 'flex', flexDirection: 'column'
            }}>
              
              <div style={{ padding: '20px 30px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                <h2 style={{ margin: 0, fontSize: '24px' }}>🛍️ Rendelés Leadása</h2>
                <button onClick={() => setIsCheckoutOpen(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>✕</button>
              </div>

              <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {/* Űrlapok... (Kapcsolat, Cím, Fizetés) */}
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>👤 Kapcsolattartó</h3>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <input type="text" name="name" value={contactData.name} onChange={handleContactChange} placeholder="Teljes név" style={inputStyle} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                      <input type="email" name="email" value={contactData.email} onChange={handleContactChange} placeholder="Email cím" style={inputStyle} />
                      <input type="tel" name="phone" value={contactData.phone} onChange={handleContactChange} placeholder="Telefonszám" style={inputStyle} />
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px' }}>
                  <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>📍 Szállítási cím</h3>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <input type="text" name="zip" value={shippingData.zip} onChange={handleAddressChange} placeholder="Irsz." style={{ ...inputStyle, width: '80px' }} />
                      <input type="text" name="city" value={shippingData.city} onChange={handleAddressChange} placeholder="Város" style={{ ...inputStyle, flex: 1 }} />
                    </div>
                    <input type="text" name="street" value={shippingData.street} onChange={handleAddressChange} placeholder="Utca, házszám" style={inputStyle} />
                    <input type="text" name="details" value={shippingData.details} onChange={handleAddressChange} placeholder="Emelet, ajtó (opcionális)" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>💳 Fizetési mód</h3>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <label style={radioLabelStyle(paymentMethod === 'bank_transfer')}>
                      <input type="radio" name="payment" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginRight: '10px' }} />
                      Banki átutalás
                    </label>
                    <label style={radioLabelStyle(paymentMethod === 'cash_on_delivery')}>
                      <input type="radio" name="payment" value="cash_on_delivery" checked={paymentMethod === 'cash_on_delivery'} onChange={(e) => setPaymentMethod(e.target.value)} style={{ marginRight: '10px' }} />
                      Utánvét
                    </label>
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>🖼️ Egyedi képek (Opcionális)</h3>
                  <div style={{ border: '2px dashed #cbd5e1', padding: '20px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: '#fdfbf7' }}>
                    <input type="file" multiple accept="image/*" onChange={(e) => setCustomImages(e.target.files)} style={{ width: '100%' }} />
                    {customImages.length > 0 && <p style={{ color: '#10b981', fontWeight: 'bold', margin: '10px 0 0 0' }}>{customImages.length} kép kiválasztva ✅</p>}
                  </div>
                </div>

                <textarea rows="2" placeholder="Megjegyzés a futárnak vagy nekünk..." value={orderNote} onChange={(e) => setOrderNote(e.target.value)} style={{ ...inputStyle, fontFamily: 'inherit' }}></textarea>

                <div style={{ padding: '20px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Termékek ára:</span><span>{cartTotal} Ft</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#64748b' }}>
                    <span>Szállítás:</span><span>{shippingCost} Ft</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '20px', borderTop: '1px dashed #86efac', paddingTop: '10px', marginTop: '10px' }}>
                    <span>Végösszeg:</span><span style={{ color: '#15803d' }}>{finalTotal} Ft</span>
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} style={{ marginTop: '3px' }} />
                  <span>Elfogadom az <Link to="/terms" target="_blank" style={{color: '#3b82f6'}}>ÁSZF</Link>-et és az <Link to="/privacy" target="_blank" style={{color: '#3b82f6'}}>Adatvédelmi nyilatkozatot</Link>.</span>
                </label>
              </div>

              <div style={{ padding: '20px 30px', borderTop: '1px solid #eee', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                <button onClick={() => setIsCheckoutOpen(false)} style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '600' }}>Mégse</button>
                <button onClick={placeOrder} className="btn-gradient">Rendelés Leadása</button>
              </div>
            </div>
          </div>
        )}

        {/* --- LÁBLÉC --- */}
        <footer className="footer" style={{ background: 'white', borderTop: '1px solid #eee', padding: '60px 20px', marginTop: 'auto' }}>
          <div className="container footer-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <div>
              <h3 style={{ margin: '0 0 15px 0' }}>🧲 Magic Magnet</h3>
              <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '14px' }}>Egyedi hűtőmágnesek, prémium minőségben, közvetlenül a gyártótól.</p>
            </div>
            <div>
              <h4 style={{ margin: '0 0 15px 0' }}>Információk</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><Link to="/about" style={{ textDecoration: 'none', color: '#64748b' }}>Rólunk</Link></li>
                <li><Link to="/shipping" style={{ textDecoration: 'none', color: '#64748b' }}>Szállítás</Link></li>
                <li><Link to="/terms" style={{ textDecoration: 'none', color: '#64748b' }}>ÁSZF</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ margin: '0 0 15px 0' }}>Kapcsolat</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', color: '#64748b', fontSize: '14px' }}>
                <li>📍 7431 Juta, Szőlőhegy u.</li>
                <li>📧 info@magnesmester.hu</li>
                <li>📞 +36 20 508 6108</li>
              </ul>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '20px', color: '#94a3b8', fontSize: '13px' }}>
            © 2025 Magic Magnet Hungary. Minden jog fenntartva.
          </div>
        </footer>

        <ChatWidget user={user} />
      </div>
    </BrowserRouter>
  );
}

// Segéd stílusok
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', transition: 'border 0.2s' };
const radioLabelStyle = (checked) => ({ flex: 1, padding: '15px', borderRadius: '10px', border: checked ? '2px solid #3b82f6' : '1px solid #cbd5e1', background: checked ? '#eff6ff' : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: checked ? 'bold' : 'normal', transition: '0.2s' });

export default App;