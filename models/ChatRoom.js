// models/ChatRoom.js
import mongoose from "mongoose";

const ChatRoomSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true, unique: true },
    username: { type: String, required: true },
    lastMessageAt: { type: Date, default: Date.now },
    unreadForAdmin: { type: Number, default: 0 },
    unreadForUser: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("ChatRoom", ChatRoomSchema);
