import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config';
import { io } from "socket.io-client";

// Socket konfiguráció az élő chathez
const socketURL = API_URL.replace('/api', '');
const socket = io(socketURL, { transports: ["websocket", "polling"] });

const AdminPanel = () => {
  // --- ÁLLAPOTOK (MINDEN MEGTARTVA) ---
  const [magnets, setMagnets] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [activeChats, setActiveChats] = useState({});
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [adminMessage, setAdminMessage] = useState("");
  const chatScrollRef = useRef(null);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const placeholderImg = "https://placehold.co/100?text=Nincs+Kep";

  // --- CHAT LOGIKA ÉS GÖRDÜLÉS ---
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedChatUser, activeChats]);

  useEffect(() => {
    // Globális értesítés figyelése
    socket.on("admin_notification", (data) => {
      const userId = data.senderId;
      setActiveChats(prev => ({
        ...prev,
        [userId]: {
          username: data.author,
          messages: [...(prev[userId]?.messages || []), data]
        }
      }));
    });

    return () => {
      socket.off("admin_notification");
    };
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

  // --- ADATKEZELÉS (MINDEN EREDETI FUNKCIÓ) ---
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
         toast.error("Lejárt a munkamenet! Jelentkezz be újra.");
      }
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { 'x-auth-token': token } }
      );
      toast.success(`Állapot frissítve: ${newStatus} ✅`);
      fetchData(); 
    } catch (err) {
      toast.error("Hiba az állapot frissítésénél");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if(!window.confirm("Biztosan VÉGLEGESEN törlöd ezt a rendelést?")) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/orders/${orderId}`, {
        headers: { 'x-auth-token': token }
      });
      toast.info("Rendelés törölve 🗑️");
      fetchData();
    } catch (err) {
      toast.error("Hiba a törlésnél");
    }
  };

  const filteredOrders = orders.filter(order => {
    if (showArchived) return true;
    return order.status !== 'Teljesítve' && order.status !== 'Törölve';
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'Feldolgozás alatt': return '#f59e0b'; 
      case 'Csomagolás': return '#3b82f6'; 
      case 'Szállítás alatt': return '#8b5cf6'; 
      case 'Teljesítve': return '#10b981'; 
      case 'Törölve': return '#ef4444'; 
      default: return '#64748b'; 
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
    setEditingId(null);
    setName("");
    setPrice("");
    setDescription("");
    setFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', name);
    data.append('price', price);
    data.append('description', description);
    if (file) data.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Content-Type': 'multipart/form-data', 'x-auth-token': token } };

      if (editingId) {
        await axios.put(`${API_URL}/magnets/${editingId}`, data, config);
        toast.success("Termék frissítve! ✅");
      } else {
        await axios.post(`${API_URL}/magnets`, data, config);
        toast.success("Sikeres feltöltés! 🎉");
      }
      handleCancelEdit();
      fetchData();
    } catch (err) {
      toast.error("Hiba történt.");
    }
  };

  const handleDeleteMagnet = (id) => {
    if(!window.confirm("Biztosan törölni akarod?")) return;
    const token = localStorage.getItem('token');
    axios.delete(`${API_URL}/magnets/${id}`, { headers: { 'x-auth-token': token } })
      .then(() => {
        toast.info("Termék törölve 🗑️");
        fetchData();
      })
      .catch(() => toast.error("Hiba a törlésnél"));
  };

  const toggleFeatured = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/magnets/${id}`, 
        { isFeatured: !currentStatus }, 
        { headers: { 'x-auth-token': token } }
      );
      fetchData();
    } catch (err) {
      toast.error("Hiba történt a kiemelés során.");
    }
  };

  // --- MEGJELENÍTÉS (FIX OLDALSÁVVAL) ---
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f1f5f9', gap: '25px', padding: '25px' }}>
      
      {/* BAL OSZLOP: FIX TERMÉK KEZELÉS ÉS CHAT */}
      <div style={{ width: '450px', display: 'flex', flexDirection: 'column', gap: '25px', position: 'sticky', top: '25px', height: 'calc(100vh - 50px)' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>⚙️ Admin Vezérlő</h1>

        {/* TERMÉK KEZELŐ KÁRTYA */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <h3 style={{ margin: 0 }}>{editingId ? "✏️ Termék Szerkesztése" : "➕ Új Termék Hozzáadása"}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Név" required value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <input type="number" placeholder="Ár" required value={price} onChange={(e) => setPrice(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <textarea placeholder="Leírás" value={description} onChange={(e) => setDescription(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', minHeight: '60px' }} />
            <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ fontSize: '13px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ flex: 1, padding: '10px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editingId ? "Mentés" : "Feltöltés"}
              </button>
              {editingId && <button type="button" onClick={handleCancelEdit} style={{ padding: '10px', background: '#e2e8f0', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Mégse</button>}
            </div>
          </form>
          
          <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto', borderTop: '1px solid #eee', paddingTop: '10px' }}>
            {magnets.map(magnet => (
              <div key={magnet._id} style={{ display: 'flex', alignItems: 'center', padding: '8px', borderBottom: '1px solid #f8fafc', gap: '10px' }}>
                <img src={magnet.imageUrl || placeholderImg} alt="" style={{ width: '35px', height: '35px', objectFit: 'cover', borderRadius: '5px' }} />
                <div style={{ flex: 1, fontSize: '13px' }}><strong>{magnet.name}</strong></div>
                <button onClick={() => toggleFeatured(magnet._id, magnet.isFeatured)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: magnet.isFeatured ? '#f59e0b' : '#cbd5e1', fontSize: '18px' }}>★</button>
                <button onClick={() => handleEditClick(magnet)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                <button onClick={() => handleDeleteMagnet(magnet._id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
              </div>
            ))}
          </div>
        </div>

        {/* CHAT KÁRTYA (Javított word-break-el) */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <h3 style={{ margin: '0 0 15px 0' }}>💬 Ügyfélszolgálat</h3>
          <div style={{ display: 'flex', flex: 1, border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ width: '130px', borderRight: '1px solid #e2e8f0', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
              {Object.keys(activeChats).map(uid => (
                <div key={uid} onClick={() => selectChat(uid)} style={{ padding: '12px 10px', cursor: 'pointer', fontSize: '12px', background: selectedChatUser === uid ? '#3b82f6' : 'transparent', color: selectedChatUser === uid ? 'white' : 'inherit', borderBottom: '1px solid #f1f5f9' }}>
                  {activeChats[uid].username}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div ref={chatScrollRef} style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedChatUser ? activeChats[selectedChatUser].messages.map((msg, i) => (
                  <div key={i} style={{ alignSelf: msg.isAdmin ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{ background: msg.isAdmin ? '#3b82f6' : '#f1f5f9', color: msg.isAdmin ? 'white' : '#1e293b', padding: '8px 12px', borderRadius: '12px', fontSize: '13px', wordBreak: 'break-word' }}>
                      {msg.message}
                    </div>
                    <div style={{fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px', textAlign: msg.isAdmin ? 'right' : 'left'}}>{msg.time}</div>
                  </div>
                )) : <p style={{ fontSize: '12px', textAlign: 'center', color: '#94a3b8' }}>Válassz csevegőt</p>}
              </div>
              {selectedChatUser && (
                <div style={{ padding: '10px', borderTop: '1px solid #eee', display: 'flex', gap: '5px' }}>
                  <input type="text" value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendAdminReply()} placeholder="Válasz..." style={{ flex: 1, padding: '8px', borderRadius: '20px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }} />
                  <button onClick={sendAdminReply} style={{ background: '#3b82f6', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>➡</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* JOBB OSZLOP: GÖRDÍTHETŐ RENDELÉSEK */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>🚚 Rendelések Kezelése</h2>
          <label style={{ fontSize: '13px', cursor: 'pointer', background: 'white', padding: '8px 15px', borderRadius: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Archívum
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
          {filteredOrders.map(order => (
            <div key={order._id} style={{ background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', borderLeft: `10px solid ${getStatusColor(order.status)}`, position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <div>
                  <strong style={{ fontSize: '18px' }}>{order.customerDetails?.name || "Vendég"}</strong>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <button onClick={() => handleDeleteOrder(order._id)} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer' }}>✕</button>
              </div>

              {/* FIZETÉSI ADATOK */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flex: 1, padding: '10px', background: '#f8fafc', borderRadius: '10px' }}>
                  <small style={{ color: '#64748b' }}>Fizetendő</small>
                  <div style={{ fontWeight: 'bold' }}>{order.totalAmount} Ft</div>
                </div>
                <div style={{ flex: 1, padding: '10px', background: order.paymentMethod === 'bank_transfer' ? '#dcfce7' : '#fee2e2', borderRadius: '10px' }}>
                  <small style={{ color: order.paymentMethod === 'bank_transfer' ? '#166534' : '#991b1b' }}>Fizetés</small>
                  <div style={{ fontWeight: 'bold' }}>{order.paymentMethod === 'bank_transfer' ? '🏦 Átutalás' : '🚚 Utánvét'}</div>
                </div>
              </div>

              {/* ÜGYFÉL KÉPEI */}
              {order.customImages && order.customImages.length > 0 && (
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>🖼️ Feltöltött fotók:</span>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {order.customImages.map((img, idx) => (
                      <div key={idx} style={{ textAlign: 'center' }}>
                        <a href={img} target="_blank" rel="noreferrer">
                          <img src={img} alt="" style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }} />
                        </a>
                        <br /><a href={img} download style={{ fontSize: '10px', color: '#3b82f6', textDecoration: 'none' }}>Letöltés</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ADATOK ÉS ÁLLAPOT */}
              <div style={{ marginBottom: '15px' }}>
                <select value={order.status} onChange={(e) => handleStatusChange(order._id, e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `2px solid ${getStatusColor(order.status)}`, fontWeight: 'bold', cursor: 'pointer' }}>
                  <option value="Feldolgozás alatt">🟠 Feldolgozás alatt</option>
                  <option value="Csomagolás">🔵 Csomagolás</option>
                  <option value="Szállítás alatt">🟣 Szállítás alatt</option>
                  <option value="Teljesítve">🟢 Teljesítve</option>
                  <option value="Törölve">🔴 Törölve</option>
                </select>
              </div>

              <div style={{ background: '#fdf2f2', padding: '12px', borderRadius: '10px', fontSize: '13px' }}>
                📍 <strong>Szállítási cím:</strong> {order.shippingAddress}
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#4b5563' }}>
                  {order.products.map((p, i) => <li key={i}>{p.name} x{p.quantity}</li>)}
                </ul>
                {order.note && <div style={{ marginTop: '10px', padding: '8px', background: '#fff', borderRadius: '5px', borderLeft: '3px solid #fbbf24', fontStyle: 'italic' }}>"{order.note}"</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;