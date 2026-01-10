// client/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../config';

const Profile = () => {
  // JAVÍTÁS: Kezdeti állapot beállítása a localStorage-ból
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await axios.get(`${API_URL}/orders/mine`, {
          headers: { 'x-auth-token': token }
        });
        setMyOrders(res.data);
      } catch (err) {
        console.error("Nem sikerült betölteni a rendeléseket:", err);
      }
    };
    fetchOrders();
  }, []);

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

  if (!user) return <div className="container" style={{padding: '50px', textAlign: 'center'}}>Kérlek jelentkezz be a profilod megtekintéséhez!</div>;

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '800px' }}>
      
      <div style={{textAlign:'center', marginBottom:'40px'}}>
        <div style={{fontSize:'4rem', marginBottom:'10px'}}>👤</div>
        <h1 style={{margin:0, color:'#0f172a'}}>Szia, {user.username}!</h1>
        <p style={{color:'#64748b'}}>{user.email}</p>
      </div>

      <h2 style={{borderBottom:'2px solid #e2e8f0', paddingBottom:'10px', marginBottom:'20px', color:'#0f172a'}}>
        📦 Korábbi rendeléseim ({myOrders.length})
      </h2>

      {myOrders.length === 0 ? (
        <p style={{color:'#64748b', fontStyle:'italic'}}>Még nem rendeltél semmit.</p>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
          {myOrders.map(order => (
            <div key={order._id} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              borderLeft: `5px solid ${getStatusColor(order.status || 'Feldolgozás alatt')}`
            }}>
              
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px', borderBottom:'1px dashed #e2e8f0', paddingBottom:'10px'}}>
                <div>
                  <div style={{fontWeight:'bold', fontSize:'0.9rem', color:'#64748b'}}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{fontSize:'0.85rem', color:'#94a3b8'}}>
                    Azonosító: #{order._id.slice(-6)}
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                   <div style={{
                     display:'inline-block', 
                     padding:'5px 10px', 
                     borderRadius:'20px', 
                     fontSize:'0.85rem', 
                     fontWeight:'bold', 
                     color:'white',
                     background: getStatusColor(order.status)
                   }}>
                     {order.status || 'Feldolgozás alatt'}
                   </div>
                   <div style={{fontWeight:'bold', fontSize:'1.1rem', marginTop:'5px', color:'#0f172a'}}>
                     {order.totalAmount} Ft
                   </div>
                </div>
              </div>

              {/* --- ÚJ: EGYEDI KÉPEK MEGJELENÍTÉSE --- */}
              {order.customImages && order.customImages.length > 0 && (
                <div style={{ marginBottom: '15px', background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                  <small style={{display:'block', marginBottom: '5px', color:'#64748b', fontWeight:'bold'}}>Feltöltött fotóid:</small>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {order.customImages.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer">
                        <img src={img} alt="egyedi kép" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div style={{marginBottom:'15px'}}>
                <ul style={{listStyle:'none', padding:0, margin:0}}>
                  {order.products.map((p, i) => (
                    <li key={i} style={{display:'flex', justifyContent:'space-between', marginBottom:'5px', fontSize:'0.95rem'}}>
                      <span>{p.name} <span style={{color:'#94a3b8'}}>x{p.quantity}</span></span>
                      <span>{p.price * p.quantity} Ft</span>
                    </li>
                  ))}
                  <li style={{display:'flex', justifyContent:'space-between', fontSize:'0.9rem', color:'#64748b', marginTop:'5px'}}>
                    <span>Szállítás</span>
                    <span>{order.shippingCost || 1990} Ft</span>
                  </li>
                </ul>
              </div>

              <div style={{background:'#f8fafc', padding:'10px', borderRadius:'8px', fontSize:'0.9rem', color:'#475569'}}>
                <strong>Szállítási cím:</strong> {order.shippingAddress}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Profile;