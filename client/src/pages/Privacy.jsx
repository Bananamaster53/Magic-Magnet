import React from 'react';

const Privacy = () => {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '800px' }}>
      <h1 style={{ color: '#0f172a', marginBottom: '20px' }}>Adatvédelmi Nyilatkozat 🔒</h1>
      <p style={{ color: '#64748b', fontStyle: 'italic', marginBottom: '20px' }}>Utolsó frissítés: 2026. január 10.</p>

      <h3 style={{ color: '#0f172a' }}>1. Az adatkezelő adatai</h3>
      <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '20px' }}>
        A Magic Magnet Hungary üzemeltetője elkötelezett a felhasználók személyes adatainak védelme iránt. Adatait bizalmasan kezeljük, és harmadik félnek nem adjuk ki, kivéve a szállítás teljesítéséhez szükséges adatokat (pl. futárszolgálat).
      </p>

      <h3 style={{ color: '#0f172a' }}>2. Kezelt adatok köre</h3>
      <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '20px' }}>
        A rendelés teljesítéséhez az alábbi adatokat kérjük be: Név, Szállítási cím, Telefonszám, Email cím.
      </p>

      <h3 style={{ color: '#0f172a' }}>3. Az adatkezelés célja</h3>
      <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '20px' }}>
        A megrendelések teljesítése, a vásárlás dokumentálása és a számviteli kötelezettség teljesítése.
      </p>
      
      <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
        Ez egy minta szöveg.
      </p>
    </div>
  );
};

export default Privacy;