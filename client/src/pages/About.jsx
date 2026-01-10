import React from 'react';

const About = () => {
  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '800px' }}>
      <h1 style={{ color: '#0f172a', marginBottom: '20px' }}>Rólunk 🧲</h1>
      <p style={{ lineHeight: '1.8', color: '#475569', marginBottom: '15px' }}>
        Üdvözöljük a <strong>Magic Magnet Hungary</strong> webáruházban!
      </p>
      <p style={{ lineHeight: '1.8', color: '#475569', marginBottom: '15px' }}>
        Cégünk egy kis, szenvedélyes csapatból áll, akik hisznek abban, hogy a hűtőmágnes nem csak egy tárgy, hanem egy emlék őrzője. Legyen szó egy nyaralásról, egy vicces pillanatról vagy egy családi fotóról, mi segítünk, hogy minden nap visszamosolyogjon Önre a hűtőszekrényről.
      </p>
      <p style={{ lineHeight: '1.8', color: '#475569', marginBottom: '15px' }}>
        Minden termékünket kézzel ellenőrizzük és a legnagyobb odafigyeléssel csomagoljuk. Célunk, hogy egyedi és minőségi termékeket kínáljunk elérhető áron, gyors szállítással.
      </p>
      <p style={{ lineHeight: '1.8', color: '#475569' }}>
        Köszönjük, hogy minket választott! <br/>
        <em>A Magic Magnet Hungary Csapata</em>
      </p>
    </div>
  );
};

export default About;