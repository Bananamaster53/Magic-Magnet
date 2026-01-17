import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { API_URL } from '../config';

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      // 1. Mentés a LocalStorage-ba (Token és User objektum is kell!)
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user)); // EZ HIÁNYZOTT
      
      // 2. Az App.jsx állapotának frissítése
      setUser(res.data.user);
      
      toast.success(`Üdv újra, ${res.data.user.username}! 👋`);
      
      // 3. Átirányítás a szerepkör alapján
      if (res.data.user.isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error("Bejelentkezési hiba:", err);
      toast.error(err.response?.data?.message || "Hibás adatok vagy szerverhiba!");
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel slide-up" style={{ padding: '40px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', marginBottom: '10px', fontWeight: '800' }}>Bejelentkezés</h2>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Jelentkezz be a fiókodba a folytatáshoz.</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input 
            className="input-modern"
            type="email" 
            placeholder="E-mail cím" 
            required 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <input 
            className="input-modern"
            type="password" 
            placeholder="Jelszó" 
            required 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          
          <button type="submit" className="btn-gradient" style={{ marginTop: '10px', fontSize: '16px' }}>
            Belépés ➡
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
          Nincs még fiókod? <Link to="/register" style={{ color: '#6366f1', fontWeight: 'bold', textDecoration: 'none' }}>Regisztrálj itt!</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;