// index.js (server)
import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import JWT from "jsonwebtoken";

import connectDB from "./confiq/db.js";

// REST routes
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import returnRoutes from "./routes/returnRoutes.js"; // ← NEW

// Chat models for socket handlers
import ChatRoom from "./models/ChatRoom.js";
import ChatMessage from "./models/ChatMessage.js";

dotenv.config();
connectDB();

const app = express();

// Dev-only allowed origins
const allowedOrigins = ["http://localhost:3000"];

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,x-api-key",
  })
);
app.options("*", cors());

app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// REST endpoints
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/notification", notificationRoutes);
app.use("/api/v1/returns", returnRoutes); // ← NEW

const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
  path: "/socket.io",
});

// Expose io so controllers can emit notifications
app.set("io", io); // ← IMPORTANT

// Authenticate socket by JWT (expects raw token)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("UNAUTHORIZED"));
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    socket.user = { _id: decoded._id, role: decoded.role, name: decoded.name };
    next();
  } catch {
    next(new Error("UNAUTHORIZED"));
  }
});

io.on("connection", (socket) => {
  // Join personal room + admins broadcast room
  const userId = socket.user?._id;
  const userRole = socket.user?.role;
  if (userId) socket.join(`user:${userId}`);
  if (userRole === 1) socket.join("admins");

  // ---- existing chat handlers ----
  socket.on("join", async ({ roomId }) => {
    if (!roomId) return;
    const room = await ChatRoom.findById(roomId).lean();
    if (!room) return;

    const isAdmin = socket.user?.role === 1;
    const isOwner = room.user?.toString() === socket.user?._id;
    if (!isAdmin && !isOwner) return;

    socket.join(roomId);
  });

  socket.on("message:send", async ({ roomId, text = "", imageUrl = "" }) => {
    if (!roomId || (!text && !imageUrl)) return;

    const room = await ChatRoom.findById(roomId);
    if (!room) return;

    const isAdmin = socket.user?.role === 1;
    const isOwner = room.user?.toString() === socket.user?._id;
    if (!isAdmin && !isOwner) return;

    const fromRole = isAdmin ? "admin" : "user";

    const msg = await ChatMessage.create({
      room: roomId,
      sender: socket.user?._id || null,
      fromRole,
      text: text.trim(),
      imageUrl,
    });

    room.lastMessageAt = new Date();
    if (fromRole === "user") room.unreadForAdmin += 1;
    else room.unreadForUser += 1;
    await room.save();

    io.to(roomId).emit("message:new", {
      _id: msg._id,
      room: roomId,
      fromRole,
      text: msg.text,
      imageUrl: msg.imageUrl,
      createdAt: msg.createdAt,
    });

    // Auto-reply on first user message
    if (fromRole === "user") {
      const count = await ChatMessage.countDocuments({ room: roomId });
      if (count === 1) {
        const auto = await ChatMessage.create({
          room: roomId,
          sender: null,
          fromRole: "system",
          text: "Thank you, we will reach you soon",
        });
        room.lastMessageAt = new Date();
        room.unreadForUser += 1;
        await room.save();

        io.to(roomId).emit("message:new", {
          _id: auto._id,
          room: roomId,
          fromRole: "system",
          text: auto.text,
          imageUrl: "",
          createdAt: auto.createdAt,
        });
      }
    }
  });

  socket.on("message:seen", async ({ roomId }) => {
    const room = await ChatRoom.findById(roomId);
    if (!room) return;
    if (socket.user?.role === 1) room.unreadForAdmin = 0;
    else if (room.user?.toString() === socket.user?._id) room.unreadForUser = 0;
    await room.save();
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
