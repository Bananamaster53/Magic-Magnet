import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ user, setUser, cartCount }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
  };

  return (
    <nav className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 1000, padding: '15px 0' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
        
        {/* LOGO */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '24px' }}>🧲</div>
          <span style={{ 
            fontSize: '22px', fontWeight: '800', 
            background: 'linear-gradient(to right, #6366f1, #3b82f6)', 
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' 
          }}>
            MagicMagnet
          </span>
        </Link>

        {/* MENÜ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={linkStyle}>Főoldal</Link>
          
          <Link to="/cart" style={{ ...linkStyle, position: 'relative', display: 'flex', alignItems: 'center', gap: '5px' }}>
            🛒 Kosár
            {cartCount > 0 && (
              <span style={{ 
                background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 'bold', 
                padding: '2px 6px', borderRadius: '10px', animation: 'pulse 2s infinite' 
              }}>
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              {user.isAdmin && <Link to="/admin" style={linkStyle}>⚙️ Admin</Link>}
              <button onClick={handleLogout} style={{ ...buttonStyle, background: '#fee2e2', color: '#b91c1c' }}>Kilépés</button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" style={{ ...buttonStyle, background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6' }}>Belépés</Link>
              <Link to="/register" className="btn-gradient" style={{ textDecoration: 'none', fontSize: '14px', padding: '8px 16px' }}>Regisztráció</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const linkStyle = { textDecoration: 'none', color: '#475569', fontWeight: '600', fontSize: '15px', transition: '0.2s' };
const buttonStyle = { border: 'none', padding: '8px 16px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: '0.2s', fontSize: '14px' };

export default Navbar;