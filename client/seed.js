// server/seed.js
const mongoose = require('mongoose');
const Magnet = require('../server/models/Magnet');

// FONTOS: Itt 127.0.0.1-et használunk localhost helyett!
const MONGO_URI = 'mongodb://127.0.0.1:27017/magnetshop';

console.log("1. ⏳ Script elindult, próbálok csatlakozni ide:", MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("2. ✅ SIKERES kapcsolat az adatbázissal!");
    runSeed();
  })
  .catch(err => {
    console.error("3. ❌ HIBA a csatlakozáskor:", err);
    process.exit(1);
  });

const seedProducts = [
  {
    name: "Neodímium Kockamágnes (10mm)",
    price: 450,
    description: "Szupererős, N52 minőségű kockamágnes.",
    imageUrl: "https://placehold.co/300/silver/black?text=Neodimium",
    stock: 50
  },
  {
    name: "Hűtőmágnes - 'Balaton'",
    price: 1200,
    description: "Kézzel festett kerámia.",
    imageUrl: "https://placehold.co/300/blue/white?text=Balaton",
    stock: 20
  },
  {
    name: "Mágneses Szalagtartó",
    price: 3500,
    description: "Műhelybe való.",
    imageUrl: "https://placehold.co/300/black/white?text=Szerszam",
    stock: 15
  },
  {
    name: "Ferrit Gyűrűmágnes",
    price: 250,
    description: "Iskolai kísérletekhez.",
    imageUrl: "https://placehold.co/300/444/white?text=Ferrit",
    stock: 100
  },
  {
    name: "Színes Irodai Mágnesek",
    price: 890,
    description: "Vegyes színekben.",
    imageUrl: "https://placehold.co/300/red/white?text=Irodai",
    stock: 200
  }
];

const runSeed = async () => {
  try {
    console.log("4. 🧹 Régi adatok törlése...");
    await Magnet.deleteMany({});
    
    console.log("5. 🌱 Új adatok beszúrása...");
    await Magnet.insertMany(seedProducts);
    
    console.log("6. 🎉 KÉSZ! Adatbázis feltöltve.");
  } catch (err) {
    console.error("HIBA a művelet közben:", err);
  } finally {
    mongoose.connection.close();
    console.log("7. 👋 Kapcsolat bontva.");
    process.exit(0);
  }
};