// client/src/components/ChatWidget.jsx
import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import { API_URL } from "../config";

// Kapcsolódás a szerverhez
const socketEndpoint = API_URL.replace('/api', ''); 
const socketURL = API_URL.replace('/api', '');

const socket = io(socketURL, {
  transports: ["websocket", "polling"], // Erőltetjük a stabilabb websocketet
  withCredentials: true // Fontos az éles szerverhez
});

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageList, setMessageList] = useState([]);

  useEffect(() => {
    // Figyeljük a beérkező üzeneteket
    socket.on("receive_message", (data) => {
      setMessageList((list) => [...list, data]);
    });
  }, []);

  const sendMessage = () => {
    const messageData = {
      author: user.username,
      message: currentMessage,
      time: new Date().toLocaleTimeString()
    };

    socket.emit("send_message", messageData); // Elküldjük a szervernek
    // NEM KELL ide külön setMessages, mert a szerver (io.emit) 
    // mindenkinek visszaküldi, neked is!
    setCurrentMessage(""); 
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999 }}>
      
      {/* 1. CHAT ABLAK (Ha nyitva van) */}
      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.header}>
            <h4>💬 Ügyfélszolgálat</h4>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>X</button>
          </div>
          
          <div style={styles.body}>
            {messageList.map((msg, index) => (
              <div key={index} style={msg.isAdmin ? styles.adminMsg : styles.userMsg}>
                <small style={{fontSize: '10px', color: '#555'}}>{msg.author} ({msg.time})</small>
                <div>{msg.message}</div>
              </div>
            ))}
          </div>

          <div style={styles.footer}>
            <input 
              type="text" 
              value={message} 
              placeholder="Írj valamit..."
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              style={styles.input}
            />
            <button onClick={sendMessage} style={styles.sendBtn}>Küldés</button>
          </div>
        </div>
      )}

      {/* 2. LEBEGŐ GOMB (Ha zárva van) */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} style={styles.floatBtn}>
          💬 Chat
        </button>
      )}
    </div>
  );
};

// CSS Stílusok (Inline a könnyű kezelhetőségért)
const styles = {
  floatBtn: { width: '60px', height: '60px', borderRadius: '50%', background: '#3498db', color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },
  chatWindow: { width: '300px', height: '400px', background: 'white', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { background: '#2c3e50', color: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' },
  body: { flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' },
  footer: { padding: '10px', borderTop: '1px solid #eee', display: 'flex', gap: '5px' },
  input: { flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' },
  sendBtn: { background: '#27ae60', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
  
  // Üzenet buborékok
  userMsg: { alignSelf: 'flex-start', background: '#ecf0f1', padding: '8px', borderRadius: '8px 8px 8px 0', maxWidth: '80%' },
  adminMsg: { alignSelf: 'flex-end', background: '#d5f5e3', padding: '8px', borderRadius: '8px 8px 0 8px', maxWidth: '80%', textAlign: 'right' }
};

export default ChatWidget;