// client/src/chat/socket.js
import { io } from "socket.io-client";

let socket;

export const initSocket = (token) => {
  if (socket && socket.connected) {
    console.log("Socket already connected, reusing:", socket.id);
    return socket;
  }

  socket = io("http://localhost:8080", {
    transports: ["websocket"],
    withCredentials: true,
    auth: { token }, // raw JWT, no "Bearer "
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connect error:", error.message);
    if (error.message === "UNAUTHORIZED") {
      console.error("Socket authentication failed: Invalid or expired token");
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    console.log("Socket closed:", socket.id);
    socket = null;
  }
};