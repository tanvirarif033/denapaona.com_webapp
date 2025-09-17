// models/ChatMessage.js
import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "ChatRoom", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    fromRole: { type: String, enum: ["user", "admin", "system"], required: true },
    text: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", ChatMessageSchema);