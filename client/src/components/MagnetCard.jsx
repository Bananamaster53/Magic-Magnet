// client/src/components/MagnetCard.jsx
import React from 'react';

const MagnetCard = ({ magnet, onAddToCart }) => {
  return (
    <div className="magnet-card">
      <div className="card-image-container">
        <img 
          src={magnet.imageUrl || "https://placehold.co/400"} 
          alt={magnet.name} 
          className="card-image" 
        />
      </div>
      
      <div className="card-details">
        <h3 className="card-title">{magnet.name}</h3>
        <p className="card-price">{magnet.price} Ft</p>
        <button className="add-btn" onClick={() => onAddToCart(magnet)}>
          Kosárba rakom
        </button>
      </div>
    </div>
  );
};

export default MagnetCard;