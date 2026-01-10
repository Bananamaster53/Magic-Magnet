// client/src/pages/Home.jsx
import React from 'react';
import { API_URL } from '../config';

const Home = ({ magnets, addToCart }) => {
  // Helyettesítő kép, ha nincs feltöltve semmi
  const placeholderImg = "https://placehold.co/400x300?text=Nincs+Kép";
  const serverBase = API_URL.replace('/api', '');

  return (
    <div>
      {/* HERO SECTION */}
      <header className="hero">
        <div className="hero-content">
          <h1>Tedd egyedivé a hűtődet! ✨</h1>
          <p>Prémium minőségű, kézzel készült mágnesek a legjobb pillanataidhoz.</p>
          <button className="hero-btn" onClick={() => {
            const el = document.getElementById('shop');
            if(el) el.scrollIntoView({behavior: 'smooth'});
          }}>
            Vásárlás indítása
          </button>
        </div>
      </header>

      {/* TERMÉK LISTA */}
      <div id="shop" className="container" style={{ padding: '60px 20px' }}>
        <h2 className="section-title">🔥 Legnépszerűbb Termékeink</h2>
        
        <div className="product-grid">
          {magnets.map(magnet => (
            <div key={magnet._id} className="product-card">
              <div className="image-container">
                {/* ITT A JAVÍTÁS: Ha nincs imageUrl, vagy üres, akkor a placeholdert használjuk */}
                <img 
                  // CSAK a magnet.imageUrl-t használd, ne írj elé API_URL-t vagy localhost-ot!
                  src={magnet.imageUrl} 
                  alt={magnet.name} 
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  // Hibakezelés: ha véletlenül mégis rossz a link, mutasson egy alap képet
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;