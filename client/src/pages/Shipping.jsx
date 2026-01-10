import React from 'react';

const Shipping = () => {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '800px' }}>
      <h1 style={{ color: '#0f172a', marginBottom: '20px' }}>Szállítási Információk 🚚</h1>
      
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#3b82f6' }}>Házhozszállítás GLS futárszolgálattal</h3>
        <p>A rendeléseket szerződött partnerünk, a GLS Hungary szállítja ki.</p>
        <ul style={{ lineHeight: '1.8', color: '#475569' }}>
          <li><strong>Szállítási idő:</strong> 1-3 munkanap</li>
          <li><strong>Szállítási díj:</strong> 1990 Ft</li>
          <li><strong>Nyomonkövetés:</strong> A csomag feladásakor emailben értesítjük a csomagszámról.</li>
        </ul>
      </div>

      <h3 style={{ color: '#0f172a' }}>Fizetési módok</h3>
      <p style={{ lineHeight: '1.8', color: '#475569' }}>
        Jelenleg az alábbi fizetési módok érhetőek el webáruházunkban:
      </p>
      <ul style={{ lineHeight: '1.8', color: '#475569' }}>
        <li>Utánvét (fizetés a futárnál készpénzzel vagy kártyával)</li>
        <li>Előre utalás (a rendelés visszaigazolásában küldött számlaszámra)</li>
      </ul>
    </div>
  );
};

export default Shipping;