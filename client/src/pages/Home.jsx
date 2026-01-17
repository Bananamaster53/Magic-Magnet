import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

const Home = ({ addToCart }) => {
  const [magnets, setMagnets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    axios.get(`${API_URL}/magnets`)
      .then(res => setMagnets(res.data))
      .catch(err => console.error(err));
  }, []);

  const filteredMagnets = magnets.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={{ paddingBottom: '50px' }}>
      
      {/* HERO SECTION */}
      <div style={{ textAlign: 'center', padding: '60px 20px', animation: 'fadeIn 1s ease' }}>
        <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '15px', color: '#1e293b' }}>
          Tedd egyedivé a <span style={{ background: 'linear-gradient(to right, #6366f1, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>hűtődet!</span>
        </h1>
        <p style={{ fontSize: '18px', color: '#64748b', maxWidth: '600px', margin: '0 auto 30px' }}>
          Prémium minőségű egyedi mágnesek, közvetlenül a gyártótól. Töltsd fel a saját képedet, vagy válassz a kollekciónkból.
        </p>
        
        {/* Kereső */}
        <input 
          type="text" 
          placeholder="🔍 Keress a mágnesek között..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="glass-panel"
          style={{ 
            width: '100%', maxWidth: '500px', padding: '15px 25px', fontSize: '16px', 
            border: '1px solid rgba(255,255,255,0.6)', borderRadius: '30px', outline: 'none' 
          }}
        />
      </div>

      {/* TERMÉK RÁCS */}
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' }}>
          {filteredMagnets.map((magnet, i) => (
            <div key={magnet._id} className="glass-panel hover-card" style={{ 
              padding: '20px', display: 'flex', flexDirection: 'column', 
              animation: `slideUp 0.6s ease forwards ${i * 0.1}s`, opacity: 0 
            }}>
              
              <div style={{ position: 'relative', marginBottom: '15px', overflow: 'hidden', borderRadius: '15px' }}>
                <img 
                  src={magnet.imageUrl} 
                  alt={magnet.name} 
                  style={{ width: '100%', height: '220px', objectFit: 'cover', transition: 'transform 0.5s' }} 
                />
                {magnet.isFeatured && (
                  <span style={{ 
                    position: 'absolute', top: '10px', right: '10px', 
                    background: 'rgba(255,255,255,0.9)', color: '#f59e0b', fontWeight: 'bold', 
                    padding: '5px 10px', borderRadius: '20px', fontSize: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' 
                  }}>
                    ⭐ Kiemelt
                  </span>
                )}
              </div>

              <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#1e293b' }}>{magnet.name}</h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#64748b', flex: 1 }}>{magnet.description}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>{magnet.price} Ft</span>
                <button onClick={() => addToCart(magnet)} className="btn-gradient" style={{ padding: '10px 20px', fontSize: '14px' }}>
                  Kosárba 🛒
                </button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;