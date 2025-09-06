// controllers/chatController.js
import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";

export const ensureUserRoom = async (req, res) => {
  const userId = req.user._id;
  const username = req.user.name || "User";
  let room = await ChatRoom.findOne({ user: userId });
  if (!room) room = await ChatRoom.create({ user: userId, username });
  res.json(room);
};

export const listRoomsForAdmin = async (_req, res) => {
  const rooms = await ChatRoom.find({})
    .sort({ lastMessageAt: -1 })
    .select("_id user username lastMessageAt unreadForAdmin unreadForUser createdAt updatedAt")
    .lean();
  res.json(rooms);
};

export const getRoomMessages = async (req, res) => {
  const { roomId } = req.params;
  const page = parseInt(req.query.page || "1", 10);
  const limit = 30;
  const skip = (page - 1) * limit;

  const messages = await ChatMessage.find({ room: roomId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  res.json({ page, messages: messages.reverse() });
};
