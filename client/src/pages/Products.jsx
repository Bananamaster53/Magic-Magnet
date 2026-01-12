// client/src/pages/Products.jsx
import React from 'react';

const Products = ({ magnets, addToCart }) => {
  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 className="section-title">Összes hűtőmágnesünk</h1>
      <div className="product-grid">
        {magnets.map(magnet => (
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
        ))}
      </div>
    </div>
  );
};

export default Products;