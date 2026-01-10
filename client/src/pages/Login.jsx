// client/src/pages/Login.jsx
import { API_URL } from '../config';
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('${API_URL}/auth/login', formData);
      
      // 1. Token mentése a böngészőbe (LocalStorage)
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      alert("Sikeres belépés!");
      
      // 2. Ha admin, menjen az admin oldalra, ha nem, a főoldalra
      if (res.data.user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
      
      // 3. Oldal frissítése, hogy a menü változzon
      window.location.reload(); 

    } catch (err) {
      alert("Hiba: " + (err.response?.data?.message || "Helytelen adatok!"));
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <h2>🔑 Bejelentkezés</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" placeholder="Email cím" required 
          value={formData.email} 
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          style={{ padding: '10px' }}
        />
        <input 
          type="password" placeholder="Jelszó" required 
          value={formData.password} 
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', background: '#27ae60', color: 'white', border: 'none', cursor: 'pointer' }}>
          Belépés
        </button>
      </form>
    </div>
  );
};

export default Login;