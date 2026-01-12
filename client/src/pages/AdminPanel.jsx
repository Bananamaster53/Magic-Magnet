import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config';
import { io } from "socket.io-client"; // Behozzuk a socketet az adminnak is

// Socket konfiguráció (ugyanaz, mint a ChatWidget-nél)
const socketURL = API_URL.replace('/api', '');
const socket = io(socketURL, { transports: ["websocket", "polling"] });

const AdminPanel = () => {
  const [magnets, setMagnets] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // --- CHAT ÁLLAPOTOK ---
  const [activeChats, setActiveChats] = useState({}); // { userId: { messages: [], username: "" } }
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [adminMessage, setAdminMessage] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const placeholderImg = "https://placehold.co/100?text=Nincs+Kep";

  // --- CHAT LOGIKA ---
  useEffect(() => {
    // Az admin minden beérkező üzenetet figyel
    socket.on("receive_message", (data) => {
      const userId = data.isAdmin ? data.receiverId : data.senderId;
      
      setActiveChats(prev => ({
        ...prev,
        [userId]: {
          username: data.isAdmin ? (prev[userId]?.username || "Felhasználó") : data.author,
          messages: [...(prev[userId]?.messages || []), data]
        }
      }));
    });

    return () => socket.off("receive_message");
  }, []);

  // Szobába lépés az adminnak is, ha kiválaszt egy júzert
  const selectChat = (userId) => {
    setSelectedChatUser(userId);
    socket.emit("join_room", userId);
  };

  const sendAdminReply = () => {
    if (adminMessage !== "" && selectedChatUser) {
      const messageData = {
        senderId: 'admin',
        receiverId: selectedChatUser,
        author: "Admin",
        message: adminMessage,
        time: new Date().getHours() + ":" + new Date().getMinutes(),
        isAdmin: true
      };

      socket.emit("send_message", messageData);
      setAdminMessage("");
    }
  };

  // --- EREDETI FUNKCIÓK (fetchData, handleSubmit, stb.) ---
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

  // ... (handleStatusChange, handleDeleteOrder, handleSubmit, stb. változatlan marad) ...
  // [Itt tartsd meg az összes korábbi handle függvényedet!]

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { 'x-auth-token': token } }
      );
      toast.success(`Állapot frissítve: ${newStatus} ✅ (E-mail elküldve)`);
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
      toast.success(!currentStatus ? "Termék kiemelve a főoldalra! ⭐" : "Kiemelés eltávolítva.");
      fetchData();
    } catch (err) {
      toast.error("Hiba történt a kiemelés során.");
    }
  };

  return (
    <div className="container" style={{maxWidth: '1400px'}}>
      <h1>⚙️ Admin Vezérlőpult</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        
        {/* --- 1. TERMÉK KEZELÉS --- */}
        <div>
          <h2>📦 Termékek</h2>
          <div className="admin-card">
            {/* ... Form változatlan ... */}
            <form onSubmit={handleSubmit} className="admin-form-container">
               <input type="text" placeholder="Név" required value={name} onChange={(e) => setName(e.target.value)} />
               <input type="number" placeholder="Ár" required value={price} onChange={(e) => setPrice(e.target.value)} />
               <textarea placeholder="Leírás" value={description} onChange={(e) => setDescription(e.target.value)} />
               <input type="file" onChange={(e) => setFile(e.target.files[0])} />
               <button type="submit">{editingId ? "Mentés" : "Feltöltés"}</button>
            </form>
          </div>
          <div className="list">
            {magnets.map(magnet => (
              <div key={magnet._id} className="admin-list-item">
                <img src={magnet.imageUrl || placeholderImg} alt="" className="admin-img" />
                <div style={{flex: 1, marginLeft: '10px'}}>
                  <strong>{magnet.name}</strong>
                  <div>{magnet.price} Ft {magnet.isFeatured && "⭐"}</div>
                </div>
                <button onClick={() => toggleFeatured(magnet._id, magnet.isFeatured)}>{magnet.isFeatured ? "★" : "☆"}</button>
                <button onClick={() => handleEditClick(magnet)}>✏️</button>
                <button onClick={() => handleDeleteMagnet(magnet._id)}>🗑️</button>
              </div>
            ))}
          </div>
        </div>

        {/* --- 2. RENDELÉSEK --- */}
        <div>
          <h2>🚚 Rendelések</h2>
          {/* ... A korábbi rendelés listázó kódod ide jön ... */}
          {filteredOrders.map(order => (
            <div key={order._id} style={{padding: '10px', border: '1px solid #ddd', marginBottom: '10px', borderRadius: '8px'}}>
               <strong>{order.customerDetails?.name}</strong> - {order.totalAmount} Ft
               <select value={order.status} onChange={(e) => handleStatusChange(order._id, e.target.value)}>
                 <option value="Feldolgozás alatt">Feldolgozás</option>
                 <option value="Teljesítve">Teljesítve</option>
               </select>
            </div>
          ))}
        </div>

        {/* --- 3. ÚJ: ÉLŐ CHAT KEZELÉS --- */}
        <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px' }}>
          <h2>💬 Élő Chatek</h2>
          <div style={{ display: 'flex', height: '500px', gap: '10px' }}>
            
            {/* Felhasználók listája */}
            <div style={{ width: '100px', borderRight: '1px solid #cbd5e1', overflowY: 'auto' }}>
              {Object.keys(activeChats).map(uid => (
                <div 
                  key={uid} 
                  onClick={() => selectChat(uid)}
                  style={{ 
                    padding: '8px', 
                    cursor: 'pointer', 
                    background: selectedChatUser === uid ? '#3b82f6' : 'white',
                    color: selectedChatUser === uid ? 'white' : 'black',
                    borderRadius: '5px',
                    marginBottom: '5px',
                    fontSize: '0.8rem'
                  }}
                >
                  {activeChats[uid].username}
                </div>
              ))}
            </div>

            {/* Aktív beszélgetés ablaka */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {selectedChatUser ? (
                <>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '10px', background: 'white', borderRadius: '5px' }}>
                    {activeChats[selectedChatUser].messages.map((msg, i) => (
                      <div key={i} style={{ 
                        textAlign: msg.isAdmin ? 'right' : 'left',
                        margin: '5px 0'
                      }}>
                        <div style={{ 
                          display: 'inline-block', 
                          padding: '6px 10px', 
                          borderRadius: '10px',
                          background: msg.isAdmin ? '#dcfce7' : '#e2e8f0',
                          fontSize: '0.9rem'
                        }}>
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex' }}>
                    <input 
                      type="text" 
                      value={adminMessage} 
                      onChange={(e) => setAdminMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendAdminReply()}
                      style={{ flex: 1, padding: '5px' }}
                      placeholder="Válasz..."
                    />
                    <button onClick={sendAdminReply}>➡</button>
                  </div>
                </>
              ) : <p style={{fontSize: '0.8rem', color: '#64748b'}}>Válassz ki egy csevegést!</p>}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;