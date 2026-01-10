// client/src/pages/Register.jsx
import { API_URL } from '../config'
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/auth/register`, formData);
      alert("Sikeres regisztráció! Most jelentkezz be.");
      navigate('/login'); // Átirányítás a belépéshez
    } catch (err) {
      alert("Hiba: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '50px' }}>
      <h2>📝 Regisztráció</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" placeholder="Felhasználónév" required 
          value={formData.username} 
          onChange={(e) => setFormData({...formData, username: e.target.value})}
          style={{ padding: '10px' }}
        />
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
        <button type="submit" style={{ padding: '10px', background: '#2c3e50', color: 'white', border: 'none', cursor: 'pointer' }}>
          Regisztráció
        </button>
      </form>
    </div>
  );
};

export default Register;