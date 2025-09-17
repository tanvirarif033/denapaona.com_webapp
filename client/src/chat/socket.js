import { io } from "socket.io-client";

let socket;

export const initSocket = (token) => {
  // Clean up existing socket if any
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // Remove "Bearer " prefix if present
  const cleanToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

  socket = io("http://localhost:8080", {
    transports: ["websocket"],
    withCredentials: true,
    auth: { token: cleanToken }, // raw JWT only
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