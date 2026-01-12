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
    // Figyeljük a globális értesítéseket is
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
        time: new Date().getHours() + ":" + new Date().getMinutes().toString().padStart(2, '0'),
        isAdmin: true
      };

      socket.emit("send_message", messageData);
      
      // JAVÍTÁS: Saját üzenet hozzáadása a listához, hogy az admin is lássa
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
                <div key={order._id} className="order-card" style={{borderLeft: `10px solid ${getStatusColor(order.status || 'Feldolgozás alatt')}`, marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                    <div>
                      <strong style={{fontSize:'1.1rem', display:'block', color:'#0f172a'}}>
                        {order.customerDetails?.name || "Vendég"}
                      </strong>
                      <small style={{color:'#64748b'}}>{new Date(order.createdAt).toLocaleString()}</small>
                      {/* --- ÚJ: FIZETÉSI MÓD --- */}
                      <div style={{
                        marginTop: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '20px',
                        background: order.paymentMethod === 'bank_transfer' ? '#dcfce7' : '#fee2e2',
                        color: order.paymentMethod === 'bank_transfer' ? '#166534' : '#991b1b',
                        border: `1px solid ${order.paymentMethod === 'bank_transfer' ? '#bbf7d0' : '#fecaca'}`
                      }}>
                        {order.paymentMethod === 'bank_transfer' ? '🏦 Banki átutalás' : '🚚 Utánvét'}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <span style={{fontWeight:'bold', fontSize:'1.2rem', color: getStatusColor(order.status)}}>{order.totalAmount} Ft</span>
                      <br/>
                      <button onClick={() => handleDeleteOrder(order._id)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', marginTop:'5px'}} title="Végleges törlés">❌</button>
                    </div>
                  </div>
                  {/* --- EGYEDI KÉPEK MEGJELENÍTÉSE LETÖLTÉSSEL --- */}
                  {order.customImages && order.customImages.length > 0 && (
                    <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>🖼️ Ügyfél fotói:</span>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {order.customImages.map((imgUrl, idx) => (
                          <div key={idx} style={{ textAlign: 'center' }}>
                            <a href={imgUrl} target="_blank" rel="noreferrer">
                              <img
                                src={imgUrl}
                                alt="Egyedi mágnes"
                                style={{ width: '75px', height: '75px', objectFit: 'cover', borderRadius: '6px', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                              />
                            </a>
                            <br />
                            <a href={imgUrl} download style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 'bold', textDecoration: 'none' }}>Letöltés</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{marginBottom:'10px', fontSize:'0.9rem', color:'#334155'}}>
                      <div>📧 {order.customerDetails?.email}</div>
                      <div>📞 {order.customerDetails?.phone}</div>
                  </div>
                  <div style={{marginBottom:'15px'}}>
                    <select
                      value={order.status || 'Feldolgozás alatt'}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="status-select"
                      style={{ width: '100%', padding: '8px', borderRadius: '5px', background: '#f8fafc', border: `1px solid ${getStatusColor(order.status)}`, cursor: 'pointer' }}
                    >
                      <option value="Feldolgozás alatt">🟠 Feldolgozás alatt</option>
                      <option value="Csomagolás">🔵 Csomagolás</option>
                      <option value="Szállítás alatt">🟣 Szállítás alatt</option>
                      <option value="Teljesítve">🟢 Teljesítve (Archivál)</option>
                      <option value="Törölve">🔴 Törölve (Archivál)</option>
                    </select>
                  </div>
                  <div style={{fontSize:'0.95rem', color:'#475569', marginBottom:'15px'}}>
                    📍 <strong>Cím:</strong> {order.shippingAddress}
                    {order.note && (
                      <div style={{marginTop:'5px', fontStyle:'italic', background:'#fffbe6', padding:'8px', borderRadius:'4px', borderLeft: '3px solid #facc15'}}>
                        " {order.note} "
                      </div>
                    )}
                  </div>
                  <div style={{background:'#f8fafc', padding:'10px', borderRadius:'8px', border: '1px solid #e2e8f0'}}>
                    <strong style={{fontSize: '0.85rem', color: '#64748b'}}>Rendelt termékek:</strong>
                    <ul style={{margin:'5px 0 0 0', paddingLeft:'20px', fontSize:'0.9rem', color:'#334155'}}>
                      {order.products.map((p, i) => (
                        <li key={i}>{p.name} <span style={{color:'#94a3b8'}}>x{p.quantity}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
        </div>
        {/* --- 3. ÚJ: ÉLŐ CHAT KEZELÉS --- */}
        <div style={adminChatStyles.mainContainer}>
          <h2 style={{ color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>💬</span> Ügyfélszolgálati Központ
          </h2>
          
          <div style={adminChatStyles.chatWrapper}>
            {/* Bal oldali felhasználó lista */}
            <div style={adminChatStyles.userSidebar}>
              <div style={adminChatStyles.sidebarHeader}>Aktív beszélgetések</div>
              {Object.keys(activeChats).length === 0 ? (
                <p style={adminChatStyles.emptyText}>Nincs aktív csevegés</p>
              ) : (
                Object.keys(activeChats).map(uid => (
                  <div 
                    key={uid} 
                    onClick={() => selectChat(uid)}
                    style={{ 
                      ...adminChatStyles.userItem,
                      backgroundColor: selectedChatUser === uid ? '#3b82f6' : 'transparent',
                      color: selectedChatUser === uid ? 'white' : '#475569'
                    }}
                  >
                    <div style={adminChatStyles.userAvatar}>{activeChats[uid].username[0]}</div>
                    <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {activeChats[uid].username}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Jobb oldali üzenetváltás */}
            <div style={adminChatStyles.messageArea}>
              {selectedChatUser ? (
                <>
                  <div style={adminChatStyles.msgHeader}>
                    <strong>{activeChats[selectedChatUser].username}</strong>
                    <span style={adminChatStyles.statusDot}></span>
                  </div>
                  
                  <div style={adminChatStyles.msgHistory}>
                    {activeChats[selectedChatUser].messages.map((msg, i) => (
                      <div key={i} style={{ 
                        display: 'flex', 
                        justifyContent: msg.isAdmin ? 'flex-end' : 'flex-start',
                        marginBottom: '12px'
                      }}>
                        <div style={{ 
                          ...adminChatStyles.bubble,
                          backgroundColor: msg.isAdmin ? '#3b82f6' : '#f1f5f9',
                          color: msg.isAdmin ? 'white' : '#1e293b',
                          alignSelf: msg.isAdmin ? 'flex-end' : 'flex-start',
                          borderRadius: msg.isAdmin ? '15px 15px 0 15px' : '15px 15px 15px 0'
                        }}>
                          <div style={{ fontSize: '0.9rem' }}>{msg.message}</div>
                          <div style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.8, textAlign: 'right' }}>
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={adminChatStyles.inputContainer}>
                    <input 
                      type="text" 
                      value={adminMessage} 
                      onChange={(e) => setAdminMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendAdminReply()}
                      placeholder="Írjon választ..."
                      style={adminChatStyles.textInput}
                    />
                    <button onClick={sendAdminReply} style={adminChatStyles.sendBtn}>
                      Küldés
                    </button>
                  </div>
                </>
              ) : (
                <div style={adminChatStyles.noSelect}>
                  <div style={{ fontSize: '40px' }}>✉️</div>
                  <p>Válasszon ki egy ügyfelet a bal oldali listából</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const adminChatStyles = {
  mainContainer: { 
    marginTop: '40px', 
    padding: '20px', 
    backgroundColor: 'white', 
    borderRadius: '16px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    width: '100%', // Kitölti a rendelkezésre álló helyet
    maxWidth: '1200px', // De ne legyen túl széles óriási monitoron
    marginInline: 'auto'
  },
  chatWrapper: { 
    display: 'flex', 
    height: '700px', // Kicsit magasabb is lehet a kényelemért
    border: '1px solid #e2e8f0', 
    borderRadius: '12px', 
    overflow: 'hidden' 
  },
  userSidebar: { 
    width: '300px', // Szélesebb oldalsáv a neveknek
    backgroundColor: '#f8fafc', 
    borderRight: '1px solid #e2e8f0', 
    display: 'flex', 
    flexDirection: 'column' 
  },
  sidebarHeader: { padding: '15px', fontWeight: 'bold', fontSize: '0.9rem', color: '#64748b', borderBottom: '1px solid #e2e8f0', textTransform: 'uppercase' },
  userItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', cursor: 'pointer', transition: '0.2s', borderBottom: '1px solid #f1f5f9' },
  userAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '0.8rem' },
  messageArea: { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    backgroundColor: 'white',
    minWidth: '0' // Fontos a belső flex tördeléshez
  },
  msgHeader: { padding: '15px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' },
  msgHistory: { 
    flex: 1, 
    padding: '20px', 
    overflowY: 'auto', 
    display: 'flex', 
    flexDirection: 'column',
    gap: '15px'
  },
  bubble: { 
    maxWidth: '85%', 
    padding: '12px 16px', 
    borderRadius: '12px',
    fontSize: '0.95rem',
    lineHeight: '1.4',
    wordBreak: 'break-word', // Ez megakadályozza, hogy a szöveg kilógjon
    whiteSpace: 'pre-wrap', // Megtartja a sorközöket és tördel
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  inputContainer: { 
    padding: '15px 20px', 
    borderTop: '1px solid #f1f5f9', 
    display: 'flex', 
    gap: '10px',
    alignItems: 'center'
  },
  textInput: { 
    flex: 1, 
    padding: '12px 15px', 
    borderRadius: '25px', // Kerekítettebb, modernebb
    border: '1px solid #e2e8f0', 
    outline: 'none',
    fontSize: '1rem'
  },
  sendBtn: { padding: '0 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  noSelect: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' },
  emptyText: { textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '0.9rem' }
};

export default AdminPanel;