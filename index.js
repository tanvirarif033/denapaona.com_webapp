// server/index.js
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
import returnRoutes from "./routes/returnRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";

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
app.use("/uploads", express.static(path.join(process.cwd(), "Uploads")));

// REST endpoints
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/review", reviewRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/notification", notificationRoutes);
app.use("/api/v1/returns", returnRoutes);
app.use("/api/v1/offer", offerRoutes);

const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
  path: "/socket.io",
});

// Expose io so controllers can emit notifications
app.set("io", io);

// Shared support room ID
const SHARED_SUPPORT_ROOM_ID = "68bb64de7067dead18540afe";

// Authenticate socket by JWT (expects raw token)
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.error("Socket auth failed: No token provided");
      return next(new Error("UNAUTHORIZED"));
    }
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    socket.user = { _id: decoded._id, role: decoded.role, name: decoded.name };
    console.log("Socket authenticated:", { userId: socket.user._id, role: socket.user.role });
    next();
  } catch (error) {
    console.error("Socket auth error:", error.message);
    next(new Error("UNAUTHORIZED"));
  }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  // Join personal room + admins broadcast room
  const userId = socket.user?._id;
  const userRole = socket.user?.role;
  if (userId) socket.join(`user:${userId}`);
  if (userRole === 1) {
    socket.join("admins");
    socket.join(SHARED_SUPPORT_ROOM_ID); // Admins join shared support room
  }

  socket.on("join", async ({ roomId }) => {
    if (!roomId) return;
    const room = await ChatRoom.findById(roomId).lean();
    if (!room) {
      console.error("Join failed: Room not found", { roomId });
      return;
    }

    const isAdmin = socket.user?.role === 1;
    const isOwner = room.user?.toString() === socket.user?._id;
    if (!isAdmin && !isOwner && roomId !== SHARED_SUPPORT_ROOM_ID) {
      console.error("Join failed: Unauthorized", { userId: socket.user._id, roomId });
      return;
    }

    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("message:send", async ({ roomId, text = "", imageUrl = "" }) => {
    if (!roomId || (!text && !imageUrl)) {
      console.error("Message send failed: Invalid data", { roomId, text, imageUrl });
      return;
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      console.error("Message send failed: Room not found", { roomId });
      return;
    }

    const isAdmin = socket.user?.role === 1;
    const isOwner = room.user?.toString() === socket.user?._id;
    if (!isAdmin && !isOwner && roomId !== SHARED_SUPPORT_ROOM_ID) {
      console.error("Message send failed: Unauthorized", { userId: socket.user._id, roomId });
      return;
    }

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

    console.log("Emitting message:new:", { _id: msg._id, room: roomId, fromRole, text: msg.text });
    io.to(roomId).emit("message:new", {
      _id: msg._id,
      room: roomId,
      fromRole,
      text: msg.text,
      imageUrl: msg.imageUrl,
      createdAt: msg.createdAt,
    });

    // Auto-reply on first user message
    if (fromRole === "user" && roomId === SHARED_SUPPORT_ROOM_ID) {
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

        console.log("Emitting auto-reply:", { _id: auto._id, room: roomId, text: auto.text });
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
    if (!room) {
      console.error("Message seen failed: Room not found", { roomId });
      return;
    }
    if (socket.user?.role === 1) room.unreadForAdmin = 0;
    else if (room.user?.toString() === socket.user?._id || roomId === SHARED_SUPPORT_ROOM_ID) {
      room.unreadForUser = 0;
    }
    await room.save();
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));