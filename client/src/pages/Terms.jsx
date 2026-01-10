import React from 'react';

const Terms = () => {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '800px' }}>
      <h1 style={{ color: '#0f172a', marginBottom: '20px' }}>Általános Szerződési Feltételek (ÁSZF) 📄</h1>
      
      <h3 style={{ color: '#0f172a' }}>1. Bevezetés</h3>
      <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '20px' }}>
        Jelen ÁSZF tartalmazza a Magic Magnet Hungary webáruház használatának feltételeit. A megrendelés leadásával a vásárló elfogadja ezeket a feltételeket.
      </p>

      <h3 style={{ color: '#0f172a' }}>2. A szerződés tárgya</h3>
      <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '20px' }}>
        A szerződés tárgya a webáruházban található valamennyi termék. A termékek adatlapján megjelenített képek illusztrációk, a valóságtól minimálisan eltérhetnek.
      </p>

      <h3 style={{ color: '#0f172a' }}>3. Rendelés menete</h3>
      <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '20px' }}>
        A vásárló a termékeket a kosárba helyezi, majd a pénztár oldalon megadja a szállítási adatokat. A rendelés leadása fizetési kötelezettséget von maga után.
      </p>

      <h3 style={{ color: '#0f172a' }}>4. Elállási jog</h3>
      <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '20px' }}>
        A fogyasztót 14 napon belül indoklás nélküli elállási jog illeti meg, amennyiben a termék sértetlen állapotban kerül visszaküldésre.
      </p>
    </div>
  );
};

export default Terms;