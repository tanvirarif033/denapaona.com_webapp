// controllers/chatController.js
import fs from "fs";
import path from "path";
import ChatRoom from "../models/ChatRoom.js";         // ✅ FIX: ../models
import ChatMessage from "../models/ChatMessage.js";   // ✅ FIX: ../models

export const ensureUserRoom = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 1;
    if (isAdmin) {
      return res.json({ _id: "admin", username: "Admin" });
    }

    let room = await ChatRoom.findOne({ user: req.user._id });
    if (!room) {
      room = await ChatRoom.create({
        user: req.user._id,
        username: req.user.name || "User",
      });
    }
    return res.json(room);
  } catch (error) {
    console.error("ensureUserRoom error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const listRoomsForAdmin = async (req, res) => {
  try {
    if (req.user?.role !== 1) return res.status(403).json({ message: "Forbidden" });

    const rooms = await ChatRoom.find({})
      .populate("user", "name email")
      .sort({ lastMessageAt: -1 })
      .lean();

    const formattedRooms = rooms.map((room) => ({
      ...room,
      username: room.user?.name || "Unknown User",
    }));

    return res.json(formattedRooms);
  } catch (error) {
    console.error("listRoomsForAdmin error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllRooms = async (req, res) => {
  try {
    if (req.user?.role !== 1) return res.status(403).json({ message: "Forbidden" });

    const rooms = await ChatRoom.find({})
      .populate("user", "name email")
      .sort({ lastMessageAt: -1 })
      .lean();

    const formattedRooms = rooms.map((room) => ({
      ...room,
      username: room.user?.name || "Unknown User",
    }));

    return res.json(formattedRooms);
  } catch (error) {
    console.error("getAllRooms error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const isAdmin = req.user?.role === 1;

    if (roomId === "admin") {
      return res.json({ messages: [] });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (!isAdmin && room.user.toString() !== req.user._id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await ChatMessage.find({ room: roomId })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ messages });
  } catch (error) {
    console.error("getRoomMessages error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Image upload endpoint (multipart/form-data, field: "image")
export const uploadChatImage = async (req, res) => {
  try {
    const file = req.files?.image;
    if (!file) return res.status(400).json({ message: "No image provided" });
    if (file.size > 2 * 1024 * 1024) {
      return res.status(400).json({ message: "Image should be <= 2MB" });
    }

    const uploadRoot = path.join(process.cwd(), "uploads");
    const chatDir = path.join(uploadRoot, "chat");
    fs.mkdirSync(chatDir, { recursive: true });

    const ext = (file.name?.split(".").pop() || "jpg").toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const destPath = path.join(chatDir, filename);

    fs.copyFileSync(file.path, destPath);

    const url = `${req.protocol}://${req.get("host")}/uploads/chat/${filename}`;
    return res.json({ url });
  } catch (err) {
    console.error("uploadChatImage error:", err);
    return res.status(500).json({ message: "Failed to upload image" });
  }
};
