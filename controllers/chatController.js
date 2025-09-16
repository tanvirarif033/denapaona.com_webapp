import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";

export const ensureUserRoom = async (req, res) => {
  try {
    const isAdmin = req.user?.role === 1;
    if (isAdmin) {
      return res.json({ _id: "admin", username: "Admin" }); // Return admin placeholder
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
    if (req.user?.role !== 1) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const rooms = await ChatRoom.find({})
      .populate("user", "name email")
      .sort({ lastMessageAt: -1 })
      .lean();
    
    // Format rooms with username
    const formattedRooms = rooms.map(room => ({
      ...room,
      username: room.user?.name || "Unknown User"
    }));
    
    return res.json(formattedRooms);
  } catch (error) {
    console.error("listRoomsForAdmin error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getAllRooms = async (req, res) => {
  try {
    if (req.user?.role !== 1) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const rooms = await ChatRoom.find({})
      .populate("user", "name email")
      .sort({ lastMessageAt: -1 })
      .lean();
    
    const formattedRooms = rooms.map(room => ({
      ...room,
      username: room.user?.name || "Unknown User"
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

    // Handle admin placeholder room
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