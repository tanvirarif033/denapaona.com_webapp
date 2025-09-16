// controllers/chatController.js
import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
const SHARED_SUPPORT_ROOM_ID = "68bb64de7067dead18540afe"; // Adjust if needed

export const ensureUserRoom = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 1;
    let room;

    if (isAdmin) {
      // Admins can access their own room or the shared support room
      room = await ChatRoom.findOne({ _id: SHARED_SUPPORT_ROOM_ID });
      if (!room) {
        // Create shared support room if it doesn't exist
        room = await ChatRoom.create({
          user: req.user._id, // Admin as initial user
          username: req.user.name || "Support",
          lastMessageAt: new Date(),
          unreadForAdmin: 0,
          unreadForUser: 0,
        });
      }
    } else {
      // Non-admins always use the shared support room
      room = await ChatRoom.findOne({ _id: SHARED_SUPPORT_ROOM_ID });
      if (!room) {
        // Fallback: Create shared room if not found (shouldn't happen after first admin access)
        room = await ChatRoom.create({
          user: req.user._id, // Non-admin user for record
          username: req.user.name || "Guest",
          lastMessageAt: new Date(),
          unreadForAdmin: 0,
          unreadForUser: 0,
        });
      }
    }

    return res.json(room);
  } catch (error) {
    console.error("ensureUserRoom error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const listRoomsForAdmin = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({}).sort({ lastMessageAt: -1 }).lean();
    return res.json(rooms);
  } catch (error) {
    console.error("listRoomsForAdmin error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const isAdmin = req.user?.role === 1;

    const room = await ChatRoom.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Allow admins to access any room, non-admins only their own or shared room
    if (!isAdmin && room.user.toString() !== req.user._id && roomId !== SHARED_SUPPORT_ROOM_ID) {
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