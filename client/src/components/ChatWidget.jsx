import React, { useState, useEffect } from 'react';
import { io } from "socket.io-client";
import { API_URL } from "../config";

const socketURL = API_URL.replace('/api', '');
const socket = io(socketURL, { transports: ["websocket", "polling"] });

const ChatWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false); 
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (user) {
      // Belépés a saját privát szobába
      socket.emit("join_room", user.id);

      // Üzenetek fogadása
      socket.on("receive_message", (data) => {
        setMessages((list) => [...list, data]);
      });
    }
    return () => socket.off("receive_message");
  }, [user]);

  const sendMessage = async () => {
    if (currentMessage !== "" && user) {
      const messageData = {
        senderId: user.id,
        receiverId: 'admin', // A júzer mindig az adminnak ír
        author: user.username,
        message: currentMessage,
        time: new Date(Date.now()).getHours() + ":" + new Date(Date.now()).getMinutes(),
        isAdmin: false
      };

      await socket.emit("send_message", messageData);
      // A saját üzenetünket is hozzáadjuk a listához, ha a szerver nem küldené vissza azonnal
      setMessages((list) => [...list, messageData]);
      setCurrentMessage(""); 
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999 }}>
      {isOpen && (
        <div style={styles.chatWindow}>
          <div style={styles.header}>
            <h4>💬 Ügyfélszolgálat</h4>
            <button onClick={() => setIsOpen(false)} style={styles.closeBtn}>X</button>
          </div>
          
          <div style={styles.body}>
            {messages.map((msg, index) => {
              // Meghatározzuk, hogy mi küldtük-e (jobb oldal) vagy az admin (bal oldal)
              const isMine = msg.senderId === user.id;
              return (
                <div key={index} style={isMine ? styles.myMsg : styles.theirMsg}>
                  <small style={{fontSize: '10px', color: '#555'}}>
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
          💬 Chat
        </button>
      )}
    </div>
  );
};

const styles = {
  floatBtn: { width: '60px', height: '60px', borderRadius: '50%', background: '#3498db', color: 'white', border: 'none', fontSize: '20px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },
  chatWindow: { width: '300px', height: '400px', background: 'white', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  header: { background: '#2c3e50', color: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' },
  body: { flex: 1, padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' },
  footer: { padding: '10px', borderTop: '1px solid #eee', display: 'flex', gap: '5px' },
  input: { flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' },
  sendBtn: { background: '#27ae60', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
  
  // Buborék pozicionálás
  myMsg: { alignSelf: 'flex-end', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '85%' },
  theirMsg: { alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '85%' },
  
  // Buborék színek
  myBubble: { background: '#3498db', color: 'white', padding: '8px 12px', borderRadius: '15px 15px 0 15px', marginTop: '2px' },
  theirBubble: { background: '#ecf0f1', color: '#2c3e50', padding: '8px 12px', borderRadius: '15px 15px 15px 0', marginTop: '2px' }
};

export default ChatWidget;