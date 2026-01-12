import React, { useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";
import { API_URL } from "../config";

const socketURL = API_URL.replace('/api', '');
const socket = io(socketURL, { transports: ["websocket", "polling"] });

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false); 
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);

  // 1. VENDÉG ID KEZELÉSE - Ha nincs user, a guestId-t használjuk
  const [guestId] = useState(() => {
    let savedId = localStorage.getItem('chat_guest_id');
    if (!savedId) {
      savedId = 'guest_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chat_guest_id', savedId);
    }
    return savedId;
  });

  // Meghatározzuk az aktuális azonosítót (User vagy Vendég)
  const chatIdentifier = user ? user.id : guestId;
  const chatUsername = user ? user.username : "Vendég_" + guestId.slice(-4);

  // Automatikus görgetés az aljára
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    // Belépés a szobába
    socket.emit("join_room", chatIdentifier);

    const handleReceiveMessage = (data) => {
      setMessages((list) => [...list, data]);
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => socket.off("receive_message", handleReceiveMessage);
  }, [chatIdentifier]);

  const sendMessage = async () => {
    if (currentMessage.trim() !== "") {
      const messageData = {
        senderId: chatIdentifier, // Fontos: a guestId-t küldjük, ha nincs user
        receiverId: 'admin', 
        author: chatUsername,
        message: currentMessage,
        time: new Date().getHours() + ":" + new Date().getMinutes().toString().padStart(2, '0'),
        isAdmin: false
      };

      socket.emit("send_message", messageData);
      setCurrentMessage(""); 
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999 }}>
      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.header}>
            <h4 style={{margin: 0}}>💬 Ügyfélszolgálat</h4>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>×</button>
          </div>
          
          <div style={styles.body} ref={scrollRef}>
            {messages.map((msg, index) => {
              // JAVÍTÁS: A chatIdentifier-t hasonlítjuk össze (ami vagy user.id, vagy guestId)
              const isMine = msg.senderId === chatIdentifier;
              
              return (
                <div key={index} style={isMine ? styles.myMsg : styles.theirMsg}>
                  <small style={{fontSize: '10px', color: '#64748b', marginBottom: '2px'}}>
                    {isMine ? "Én" : "Admin"} ({msg.time})
                  </small>
                  <div style={isMine ? styles.myBubble : styles.theirBubble}>
                    {msg.message}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.footer}>
            <input 
              type="text" 
              value={currentMessage} 
              placeholder="Írj valamit..."
              onChange={(e) => setCurrentMessage(e.target.value)} 
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              style={styles.input}
            />
            <button onClick={sendMessage} style={styles.sendBtn}>Küldés</button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button onClick={() => setIsOpen(true)} style={styles.floatBtn}>
          💬
        </button>
      )}
    </div>
  );
};

const styles = {
  floatBtn: { width: '60px', height: '60px', borderRadius: '50%', background: '#3b82f6', color: 'white', border: 'none', fontSize: '24px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chatWindow: { width: '320px', height: '450px', background: 'white', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0' },
  header: { background: '#1e293b', color: 'white', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' },
  body: { flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' },
  footer: { padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', backgroundColor: 'white' },
  input: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' },
  sendBtn: { background: '#3b82f6', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  myMsg: { alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '85%' },
  theirMsg: { alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '85%' },
  myBubble: { background: '#3b82f6', color: 'white', padding: '10px 14px', borderRadius: '15px 15px 0 15px', wordBreak: 'break-word', fontSize: '14px' },
  theirBubble: { background: '#e2e8f0', color: '#1e293b', padding: '10px 14px', borderRadius: '15px 15px 15px 0', wordBreak: 'break-word', fontSize: '14px' }
};

export default ChatWidget;