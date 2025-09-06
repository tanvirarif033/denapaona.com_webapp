// client/src/chat/socket.js
import { io } from "socket.io-client";

let socket;

export const initSocket = (token) => {
  if (!socket) {
    socket = io("http://localhost:8080", {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token }, // raw JWT, no "Bearer "
    });
  }
  return socket;
};

export const getSocket = () => socket;
export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
