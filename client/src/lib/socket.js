// src/lib/socket.js
import { io } from "socket.io-client";

export const makeSocket = (token) => {
  if (!token) return null;
  return io(process.env.REACT_APP_API || "http://localhost:8080", {
    withCredentials: true,
    path: "/socket.io",
    auth: { token }
  });
};
