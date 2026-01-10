// client/src/config.js

const hostname = window.location.hostname;

// Most már a 192.168-as címeket is "helyinek" vesszük
const isLocalhost = hostname === "localhost" || 
                    hostname === "127.0.0.1" || 
                    hostname.startsWith("192.168.");

// Ha helyi gépen vagyunk, akkor a backend címe dinamikusan igazodik az IP-hez.
// Ha élesben, akkor a Renderes linket használja.
export const API_URL = isLocalhost 
  ? `http://${hostname}:5000/api` 
  : "https://magnes-mester-backend.onrender.com/api";