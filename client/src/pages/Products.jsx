import React, { useState } from 'react';

const Products = ({ magnets, addToCart }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("default");
  const [maxPrice, setMaxPrice] = useState(10000); // Alapértelmezett maximum ár

  // 1. Szűrés név és ár alapján
  const filteredMagnets = magnets.filter(magnet =>
    magnet.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    magnet.price <= maxPrice
  );

  // 2. Rendezés ár alapján
  const sortedMagnets = [...filteredMagnets].sort((a, b) => {
    if (sortOrder === "low-to-high") return a.price - b.price;
    if (sortOrder === "high-to-low") return b.price - a.price;
    return 0;
  });

  return (
    <div className="container" style={{ padding: '40px 20px', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
      
      {/* --- BAL OLDALI SZŰRŐSÁV --- */}
      <aside style={{ 
        flex: '0 0 250px', 
        background: '#f8fafc', 
        padding: '20px', 
        borderRadius: '12px',
        height: 'fit-content',
        position: 'sticky',
        top: '100px' // Hogy görgetésnél szem előtt maradjon
      }}>
        <h3 style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>Szűrés</h3>
        
        {/* Név kereső */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Termék neve</label>
          <input 
            type="text" 
            placeholder="Keresés..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        {/* Ár csúszka */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Max ár: {maxPrice} Ft
          </label>
          <input 
            type="range" 
            min="0" 
            max="10000" 
            step="100"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{ width: '100%', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
            <span>0 Ft</span>
            <span>10.000 Ft</span>
          </div>
        </div>

        {/* Rendezés */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Rendezés</label>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
          >
            <option value="default">Alapértelmezett</option>
            <option value="low-to-high">Olcsók előre</option>
            <option value="high-to-low">Drágák előre</option>
          </select>
        </div>
      </aside>

      {/* --- JOBB OLDALI TERMÉKRÁCS --- */}
      <main style={{ flex: '1', minWidth: '300px' }}>
        <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '30px' }}>Mágnesek ({sortedMagnets.length})</h1>
        
        <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {sortedMagnets.length > 0 ? (
            sortedMagnets.map(magnet => (
              <div key={magnet._id} className="product-card">
                <div className="image-container">
                  <img 
                    src={magnet.imageUrl} 
                    alt={magnet.name} 
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/200'; }}
                  />
                </div>
                <div className="card-details">
                  <h3>{magnet.name}</h3>
                  <p className="price-tag">{magnet.price} Ft</p>
                  <button className="add-btn" onClick={() => addToCart(magnet)}>Kosárba +</button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', gridColumn: '1/-1' }}>
              <h3>Nem találtunk ilyen mágnest... 🧲</h3>
              <p>Próbálj más keresési feltételt megadni.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Products;