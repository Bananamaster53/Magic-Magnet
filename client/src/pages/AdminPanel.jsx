import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config';
import { io } from "socket.io-client";

// Socket konfiguráció
const socketURL = API_URL.replace('/api', '');
const socket = io(socketURL, { transports: ["websocket", "polling"] });

const AdminPanel = () => {
  // --- ÁLLAPOTOK ---
  const [magnets, setMagnets] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Chat
  const [activeChats, setActiveChats] = useState({});
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [showChatModal, setShowChatModal] = useState(false);
  const chatScrollRef = useRef(null);

  // Termék
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  // Szűrés
  const [showArchived, setShowArchived] = useState(false);

  const placeholderImg = "https://placehold.co/100?text=Nincs+Kep";

  // --- LOGIKA ---
  
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedChatUser, activeChats, showChatModal]);

  useEffect(() => {
    socket.on("admin_notification", (data) => {
      const userId = data.senderId;
      setActiveChats(prev => ({
        ...prev,
        [userId]: {
          username: data.author,
          messages: [...(prev[userId]?.messages || []), data]
        }
      }));
      // Kis hangjelzés vagy toast
      // toast.info(`💬 Új üzenet: ${data.author}`);
    });
    return () => socket.off("admin_notification");
  }, []);

  const selectChat = (userId) => {
    setSelectedChatUser(userId);
    socket.emit("join_room", userId);
  };

  const sendAdminReply = () => {
    if (adminMessage.trim() !== "" && selectedChatUser) {
      const messageData = {
        senderId: 'admin',
        receiverId: selectedChatUser,
        author: "Admin",
        message: adminMessage,
        time: new Date().getHours() + ":" + new Date().getMinutes().toString().padStart(2, '0'),
        isAdmin: true
      };
      socket.emit("send_message", messageData);
      setActiveChats(prev => ({
        ...prev,
        [selectedChatUser]: {
          ...prev[selectedChatUser],
          messages: [...(prev[selectedChatUser]?.messages || []), messageData]
        }
      }));
      setAdminMessage("");
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const productRes = await axios.get(`${API_URL}/magnets`);
      setMagnets(productRes.data);
      const orderRes = await axios.get(`${API_URL}/orders/all`, {
        headers: { 'x-auth-token': token }
      });
      setOrders(orderRes.data.reverse());
    } catch (err) {
      console.error(err);
      if(err.response && err.response.status === 401) {
         toast.error("Lejárt a munkamenet!");
      }
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/orders/${orderId}/status`, { status: newStatus }, { headers: { 'x-auth-token': token } });
      toast.success(`Állapot: ${newStatus} ✅`);
      fetchData(); 
    } catch (err) { toast.error("Hiba az állapot frissítésénél"); }
  };

  const handleDeleteOrder = async (orderId) => {
    if(!window.confirm("Véglegesen törlöd?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/orders/${orderId}`, { headers: { 'x-auth-token': token } });
      toast.info("Törölve 🗑️");
      fetchData();
    } catch (err) { toast.error("Hiba a törlésnél"); }
  };

  const filteredOrders = orders.filter(order => showArchived || (order.status !== 'Teljesítve' && order.status !== 'Törölve'));

  // Színek és Státuszok modernizálása
  const getStatusStyle = (status) => {
    switch(status) {
      case 'Feldolgozás alatt': return { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' }; // Narancs
      case 'Csomagolás': return { bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd' }; // Kék
      case 'Szállítás alatt': return { bg: '#f5f3ff', text: '#6d28d9', border: '#c4b5fd' }; // Lila
      case 'Teljesítve': return { bg: '#f0fdf4', text: '#15803d', border: '#86efac' }; // Zöld
      case 'Törölve': return { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' }; // Piros
      default: return { bg: '#f8fafc', text: '#475569', border: '#cbd5e1' };
    }
  };

  const handleEditClick = (magnet) => {
    setEditingId(magnet._id);
    setName(magnet.name);
    setPrice(magnet.price);
    setDescription(magnet.description || "");
    setFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null); setName(""); setPrice(""); setDescription(""); setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', name); data.append('price', price); data.append('description', description);
    if (file) data.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token } };
      if (editingId) {
        await axios.put(`${API_URL}/magnets/${editingId}`, data, config);
        toast.success("Frissítve! ✨");
      } else {
        await axios.post(`${API_URL}/magnets`, data, config);
        toast.success("Létrehozva! 🚀");
      }
      handleCancelEdit(); fetchData();
    } catch (err) { toast.error("Hiba történt."); }
  };

  const handleDeleteMagnet = (id) => {
    if(!window.confirm("Törlöd?")) return;
    const token = localStorage.getItem('token');
    axios.delete(`${API_URL}/magnets/${id}`, { headers: { 'x-auth-token': token } })
      .then(() => { toast.info("Termék törölve"); fetchData(); })
      .catch(() => toast.error("Hiba"));
  };

  const toggleFeatured = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/magnets/${id}`, { isFeatured: !currentStatus }, { headers: { 'x-auth-token': token } });
      fetchData();
    } catch (err) { toast.error("Hiba"); }
  };

  // --- MODERN CSS INJECT ---
  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', // Finom háttér
      gap: '30px', 
      padding: '30px',
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* CSS Animációk definiálása */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        
        * { box-sizing: border-box; }
        
        .fade-in { animation: fadeIn 0.8s ease forwards; opacity: 0; }
        .slide-up { animation: slideUp 0.6s ease forwards; opacity: 0; transform: translateY(20px); }
        
        @keyframes fadeIn { to { opacity: 1; } }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); } 70% { box-shadow: 0 0 0 15px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }
        @keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .glass-panel {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
          border-radius: 20px;
        }

        .hover-scale { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-scale:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }

        .btn-gradient {
          background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%);
          color: white; border: none; border-radius: 12px;
          padding: 12px 20px; font-weight: 600; cursor: pointer;
          transition: filter 0.3s;
        }
        .btn-gradient:hover { filter: brightness(110%); }

        .input-modern {
          width: 100%; padding: 12px 15px; border-radius: 12px;
          border: 1px solid #e2e8f0; background: #f8fafc;
          transition: border-color 0.3s, box-shadow 0.3s;
          outline: none;
        }
        .input-modern:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); background: white; }

        .chat-bubble-admin { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border-radius: 18px 18px 4px 18px; }
        .chat-bubble-user { background: #f1f5f9; color: #1e293b; border-radius: 18px 18px 18px 4px; }

        /* Scrollbar styling */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* --- BAL OLDALI SÁV (FIX) --- */}
      <div className="glass-panel slide-up" style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '25px', position: 'sticky', top: '30px', height: 'calc(100vh - 60px)', padding: '25px', zIndex: 10 }}>
        
        {/* Címsor */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h1 style={{ margin: 0, fontSize: '28px', background: 'linear-gradient(to right, #6366f1, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>
            ✨ Admin Vezérlő
          </h1>
          <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '13px' }}>Magic Magnet Management v2.0</p>
        </div>

        {/* Termék szerkesztő */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px', overflow: 'hidden' }}>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingId ? "✏️ Szerkesztés" : "➕ Új Termék"}
          </h3>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input className="input-modern" type="text" placeholder="Termék neve" required value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input-modern" type="number" placeholder="Ár (Ft)" required value={price} onChange={(e) => setPrice(e.target.value)} />
            <textarea className="input-modern" placeholder="Leírás..." value={description} onChange={(e) => setDescription(e.target.value)} style={{ minHeight: '80px', resize: 'vertical' }} />
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
              <span style={{ fontSize: '20px' }}>📷</span>
              <span style={{ fontSize: '13px', color: '#64748b' }}>{file ? file.name : "Kép kiválasztása..."}</span>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ display: 'none' }} />
            </label>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn-gradient" style={{ flex: 1, boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)' }}>
                {editingId ? "Mentés" : "Létrehozás"}
              </button>
              {editingId && <button type="button" onClick={handleCancelEdit} style={{ padding: '10px 15px', borderRadius: '12px', border: 'none', background: '#e2e8f0', cursor: 'pointer' }}>Mégse</button>}
            </div>
          </form>

          {/* Mini Termék Lista */}
          <div style={{ flex: 1, overflowY: 'auto', marginTop: '10px', paddingRight: '5px' }}>
            {magnets.map((magnet, i) => (
              <div key={magnet._id} className="hover-scale" style={{ 
                display: 'flex', alignItems: 'center', padding: '10px', marginBottom: '8px',
                background: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', gap: '10px',
                animation: `fadeIn 0.5s ease forwards ${i * 0.05}s`, opacity: 0 
              }}>
                <img src={magnet.imageUrl || placeholderImg} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: '600', fontSize: '14px', color: '#334155' }}>{magnet.name}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>{magnet.price} Ft</div>
                </div>
                <button onClick={() => toggleFeatured(magnet._id, magnet.isFeatured)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', filter: magnet.isFeatured ? 'grayscale(0)' : 'grayscale(100%) opacity(0.3)', transition: '0.3s' }}>⭐</button>
                <button onClick={() => handleEditClick(magnet)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => handleDeleteMagnet(magnet._id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer' }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Gomb */}
        <div style={{ marginTop: 'auto' }}>
          <button 
            onClick={() => setShowChatModal(true)}
            className="btn-gradient"
            style={{ 
              width: '100%', padding: '18px', fontSize: '16px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              animation: 'pulse 2s infinite', borderRadius: '16px'
            }}
          >
            💬 Chat Megnyitása 
            <span style={{ background: 'white', color: '#6366f1', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>{Object.keys(activeChats).length}</span>
          </button>
        </div>
      </div>

      {/* --- JOBB OLDAL: RENDELÉSEK --- */}
      <div className="slide-up" style={{ flex: 1, animationDelay: '0.2s', display: 'flex', flexDirection: 'column' }}>
        
        {/* Fejléc */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>📦 Rendelések Kezelése</h2>
          <label className="glass-panel hover-scale" style={{ padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
            Archivált rendelések megjelenítése
          </label>
        </div>

        {/* Rendelés Rács */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '25px', paddingBottom: '50px' }}>
          {filteredOrders.map((order, i) => {
            const statusStyle = getStatusStyle(order.status);
            return (
              <div key={order._id} className="glass-panel hover-scale" style={{ 
                padding: '25px', position: 'relative', 
                borderLeft: `6px solid ${statusStyle.border}`,
                animation: `slideUp 0.5s ease forwards ${i * 0.1}s`, opacity: 0
              }}>
                {/* Fejléc: Név + Dátum + Törlés */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', color: '#0f172a' }}>{order.customerDetails?.name || "Ismeretlen"}</h3>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      📅 {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteOrder(order._id)} style={{ border: 'none', background: '#fecaca', color: '#991b1b', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' }}>✕</button>
                </div>

                {/* Adatok Rács */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Összeg</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{order.totalAmount} Ft</div>
                  </div>
                  <div style={{ background: order.paymentMethod === 'bank_transfer' ? '#f0fdf4' : '#fef2f2', padding: '12px', borderRadius: '12px' }}>
                    <div style={{ fontSize: '11px', color: order.paymentMethod === 'bank_transfer' ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>Fizetés</div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: order.paymentMethod === 'bank_transfer' ? '#15803d' : '#b91c1c' }}>
                      {order.paymentMethod === 'bank_transfer' ? '🏦 Átutalás' : '🚚 Utánvét'}
                    </div>
                  </div>
                </div>

                {/* Képek */}
                {order.customImages?.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Feltöltött fotók ({order.customImages.length} db)</div>
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                      {order.customImages.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer" style={{ position: 'relative', transition: 'transform 0.2s' }} className="hover-scale">
                          <img src={img} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '10px', border: '2px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                          <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'white', borderRadius: '50%', padding: '2px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>⬇️</div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Státusz + Cím */}
                <div style={{ marginBottom: '15px' }}>
                  <select 
                    value={order.status} 
                    onChange={(e) => handleStatusChange(order._id, e.target.value)} 
                    style={{ 
                      width: '100%', padding: '12px', borderRadius: '12px', 
                      background: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`,
                      fontWeight: '600', cursor: 'pointer', outline: 'none'
                    }}
                  >
                    <option value="Feldolgozás alatt">🟠 Feldolgozás alatt</option>
                    <option value="Csomagolás">🔵 Csomagolás</option>
                    <option value="Szállítás alatt">🟣 Szállítás alatt</option>
                    <option value="Teljesítve">🟢 Teljesítve</option>
                    <option value="Törölve">🔴 Törölve</option>
                  </select>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', fontSize: '13px', color: '#475569' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '5px' }}>📍 <strong>{order.shippingAddress}</strong></div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{order.products.map(p => `${p.name} (x${p.quantity})`).join(', ')}</div>
                  {order.note && <div style={{ marginTop: '10px', padding: '8px', background: '#fffbeb', color: '#b45309', borderRadius: '6px', fontStyle: 'italic' }}>"{order.note}"</div>}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* --- CHAT MODAL (NAGY ÉS LÁTVÁNYOS) --- */}
      {showChatModal && (
        <div style={{ 
          position: 'fixed', inset: 0, zIndex: 1000, 
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{ 
            width: '1000px', height: '85vh', background: 'white', 
            borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
            display: 'flex', overflow: 'hidden', animation: 'modalPop 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            
            {/* Bal sáv: Lista */}
            <div style={{ width: '320px', background: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
                <h2 style={{ margin: 0, fontSize: '20px' }}>Üzenetek</h2>
                <div style={{ fontSize: '13px', color: '#64748b' }}>{Object.keys(activeChats).length} aktív beszélgetés</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {Object.keys(activeChats).map(uid => (
                  <div key={uid} onClick={() => selectChat(uid)} style={{ 
                    padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: '0.2s',
                    background: selectedChatUser === uid ? 'white' : 'transparent',
                    borderLeft: selectedChatUser === uid ? '4px solid #3b82f6' : '4px solid transparent',
                    boxShadow: selectedChatUser === uid ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none'
                  }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{activeChats[uid].username}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeChats[uid].messages[activeChats[uid].messages.length - 1]?.message || "..."}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Jobb sáv: Chat */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white' }}>
              {/* Fejléc */}
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px' }}>
                  {selectedChatUser ? activeChats[selectedChatUser].username : "Válassz partnert"}
                </h3>
                <button onClick={() => setShowChatModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', fontSize: '18px', color: '#64748b' }}>✕</button>
              </div>

              {/* Üzenetek */}
              <div ref={chatScrollRef} style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px', backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                {selectedChatUser ? activeChats[selectedChatUser].messages.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.isAdmin ? 'flex-end' : 'flex-start', maxWidth: '70%', animation: 'slideUp 0.3s ease' }}>
                    <div className={msg.isAdmin ? 'chat-bubble-admin' : 'chat-bubble-user'} style={{ padding: '12px 20px', fontSize: '15px', lineHeight: '1.5', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', wordBreak: 'break-word' }}>
                      {msg.message}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px', textAlign: msg.isAdmin ? 'right' : 'left', padding: '0 5px' }}>{msg.time}</div>
                  </div>
                )) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#cbd5e1' }}>
                    <div style={{ fontSize: '60px', marginBottom: '20px' }}>💬</div>
                    <div>Nincs kiválasztott beszélgetés</div>
                  </div>
                )}
              </div>

              {/* Input */}
              {selectedChatUser && (
                <div style={{ padding: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={adminMessage} 
                    onChange={(e) => setAdminMessage(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && sendAdminReply()} 
                    placeholder="Üzenet írása..." 
                    style={{ flex: 1, padding: '15px 20px', borderRadius: '30px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', outline: 'none' }}
                  />
                  <button onClick={sendAdminReply} className="btn-gradient" style={{ width: '50px', height: '50px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)' }}>
                    ➤
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;