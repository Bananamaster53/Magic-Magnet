// client/src/pages/Home.jsx
import React from 'react';

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
                  src={magnet.imageUrl && magnet.imageUrl.length > 0 ? magnet.imageUrl : placeholderImg} 
                  alt={magnet.name} 
                  onError={(e) => { e.target.src = placeholderImg; }} // Ha a kép link törött, akkor is cserélje le
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