// client/src/pages/Home.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Behozzuk a Linket a navigációhoz
import { API_URL } from '../config';

const Home = ({ magnets, addToCart }) => {
  // Helyettesítő kép, ha nincs feltöltve semmi
  const placeholderImg = "https://placehold.co/400x300?text=Nincs+Kép";

  return (
    <div>
      {/* HERO SECTION */}
      <header className="hero">
        <div className="hero-content">
          <h1>Tedd egyedivé a hűtődet! ✨</h1>
          <p>Prémium minőségű, kézzel készült mágnesek a legjobb pillanataidhoz.</p>
          
          {/* MÓDOSÍTÁS: A gomb mostantól az összes termék oldalra visz */}
          <Link to="/products" className="hero-btn" style={{ textDecoration: 'none', display: 'inline-block' }}>
            Vásárlás indítása
          </Link>
        </div>
      </header>

      {/* TERMÉK LISTA - Főoldali kiemelt termékek */}
      <div id="shop" className="container" style={{ padding: '60px 20px' }}>
        <h2 className="section-title">🔥 Legnépszerűbb Termékeink</h2>
        
        <div className="product-grid">
          {magnets.length > 0 ? (
            magnets.map(magnet => (
              <div key={magnet._id} className="product-card">
                <div className="image-container">
                  <img 
                    src={magnet.imageUrl || placeholderImg} 
                    alt={magnet.name} 
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200'; }}
                  />
                </div>
                
                <div className="card-details">
                  <h3>{magnet.name}</h3>
                  <p className="description">{magnet.description || "Kiváló minőségű hűtőmágnes."}</p>
                  
                  <div className="price-row">
                    <span className="price-tag">{magnet.price} Ft</span>
                    <button className="add-btn" onClick={() => addToCart(magnet)}>
                      Kosárba +
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', width: '100%', color: '#64748b' }}>
              Jelenleg nincsenek kiemelt termékek a főoldalon.
            </p>
          )}
        </div>
        
        {/* ÚJ: Gomb a teljes kínálathoz a lista alatt is */}
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/products" className="secondary-btn" style={{ color: '#2563eb', fontWeight: 'bold' }}>
            Összes termék megtekintése →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;