// client/src/pages/AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config';

const AdminPanel = () => {
  const [magnets, setMagnets] = useState([]);
  const [orders, setOrders] = useState([]);
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  const placeholderImg = "https://placehold.co/100?text=Nincs+Kep";

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

  return (
    <div className="container">
      <h1>⚙️ Admin Vezérlőpult</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
        
        {/* --- BAL OSZLOP: TERMÉK KEZELÉS --- */}
        <div>
          <h2>📦 Termék Kezelés</h2>
          <div className="admin-card">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px'}}>
              <h3 style={{margin:0}}>{editingId ? "✏️ Szerkesztés" : "➕ Új Mágnes"}</h3>
              {editingId && <button onClick={handleCancelEdit} style={{background:'none', border:'none', cursor:'pointer', color:'#64748b', textDecoration:'underline'}}>Mégse</button>}
            </div>
            
            <form onSubmit={handleSubmit} className="admin-form-container">
              <div>
                <label className="admin-label">Termék neve</label>
                <input type="text" placeholder="Pl: Balatoni naplemente" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="admin-label">Ár (Ft)</label>
                <input type="number" placeholder="Pl: 1500" required value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div>
                <label className="admin-label">Leírás</label>
                <textarea placeholder="Rövid leírás..." rows="3" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="admin-label">{editingId ? "Új kép (opcionális):" : "Kép feltöltése:"}</label>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
              </div>
              <button type="submit" className={editingId ? "update-btn" : "submit-btn"} style={{marginTop:'10px'}}>
                {editingId ? "Mentés" : "Feltöltés"}
              </button>
            </form>
          </div>

          <div className="list">
            {magnets.map(magnet => (
              <div key={magnet._id} className="admin-list-item">
                <img 
                  src={magnet.imageUrl || placeholderImg} 
                  alt="" 
                  className="admin-img"
                  onError={(e) => { e.target.src = placeholderImg; }}
                />
                <div style={{flex: 1, marginLeft: '15px'}}>
                  <strong>{magnet.name}</strong>
                  <div style={{color:'#64748b'}}>{magnet.price} Ft</div>
                </div>
                <div style={{display:'flex', gap:'5px'}}>
                  <button onClick={() => handleEditClick(magnet)} className="edit-btn">✏️</button>
                  <button onClick={() => handleDeleteMagnet(magnet._id)} className="delete-btn">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- JOBB OSZLOP: RENDELÉSEK --- */}
        <div>
           <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
              <h2 style={{margin:0}}>🚚 Rendelések ({filteredOrders.length})</h2>
              <label style={{fontSize:'0.9rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', color:'#64748b'}}>
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Archívum mutatása
              </label>
           </div>

           {filteredOrders.length === 0 ? <p style={{color:'#64748b'}}>Nincs aktív teendő.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredOrders.map(order => (
                <div key={order._id} className="order-card" style={{borderLeft: `10px solid ${getStatusColor(order.status || 'Feldolgozás alatt')}`, marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
                  
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
                    <div>
                      <strong style={{fontSize:'1.1rem', display:'block', color:'#0f172a'}}>
                        {order.customerDetails?.name || "Vendég"}
                      </strong>
                      <small style={{color:'#64748b'}}>{new Date(order.createdAt).toLocaleString()}</small>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <span style={{fontWeight:'bold', fontSize:'1.2rem', color: getStatusColor(order.status)}}>{order.totalAmount} Ft</span>
                      <br/>
                      <button onClick={() => handleDeleteOrder(order._id)} style={{background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', marginTop:'5px'}} title="Végleges törlés">❌</button>
                    </div>
                  </div>

                  {/* --- ÚJ: EGYEDI KÉPEK MEGJELENÍTÉSE --- */}
                  {order.customImages && order.customImages.length > 0 && (
                    <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '8px' }}>🖼️ Ügyfél fotói (Kattints a nagyításhoz):</span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {order.customImages.map((imgUrl, idx) => (
                          <a key={idx} href={imgUrl} target="_blank" rel="noreferrer">
                            <img 
                              src={imgUrl} 
                              alt="Egyedi mágnes" 
                              style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} 
                            />
                          </a>
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
                      style={{ width: '100%', padding: '8px', borderRadius: '5px', background: '#f8fafc', border: `1px solid ${getStatusColor(order.status)}` }}
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
           )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;