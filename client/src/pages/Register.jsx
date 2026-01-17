import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_URL } from '../config';

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/register`, { username, email, password });
      toast.success("Sikeres regisztráció! Most már beléphetsz. 🎉");
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || "Hiba a regisztrációnál.");
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel slide-up" style={{ padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>Regisztráció</h2>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Csatlakozz a MagicMagnet közösséghez!</p>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input className="input-modern" type="text" placeholder="Felhasználónév" required value={username} onChange={(e) => setUsername(e.target.value)} />
          <input className="input-modern" type="email" placeholder="E-mail cím" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-modern" type="password" placeholder="Jelszó" required value={password} onChange={(e) => setPassword(e.target.value)} />
          
          <button type="submit" className="btn-gradient" style={{ marginTop: '10px', fontSize: '16px' }}>
            Regisztráció ✨
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          Már van fiókod? <Link to="/login" style={{ color: '#3b82f6', fontWeight: 'bold', textDecoration: 'none' }}>Jelentkezz be!</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;