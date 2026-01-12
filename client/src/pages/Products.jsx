import React, { useState } from 'react';

const Products = ({ magnets, addToCart }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("default");

  // 1. Szűrés név alapján
  const filteredMagnets = magnets.filter(magnet =>
    magnet.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Rendezés ár alapján
  const sortedMagnets = [...filteredMagnets].sort((a, b) => {
    if (sortOrder === "low-to-high") return a.price - b.price;
    if (sortOrder === "high-to-low") return b.price - a.price;
    return 0; // Alapértelmezett sorrend
  });

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 className="section-title">Összes hűtőmágnesünk</h1>

      {/* --- SZŰRŐ PANEL --- */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '30px', 
        flexWrap: 'wrap',
        background: '#f8fafc',
        padding: '20px',
        borderRadius: '12px'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Keresés név alapján:</label>
          <input 
            type="text" 
            placeholder="Pl: Balaton..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        <div style={{ minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Rendezés:</label>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          >
            <option value="default">Alapértelmezett</option>
            <option value="low-to-high">Ár: alacsonytól a magasig</option>
            <option value="high-to-low">Ár: magastól az alacsonyig</option>
          </select>
        </div>
      </div>

      {/* --- TERMÉK RÁCS --- */}
      <div className="product-grid">
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
          <p style={{ textAlign: 'center', width: '100%', gridColumn: '1 / -1', padding: '40px' }}>
            Nincs a keresésnek megfelelő mágnes. 🔍
          </p>
        )}
      </div>
    </div>
  );
};

export default Products;