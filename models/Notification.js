// models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "users", index: true },
    title:  { type: String, required: true },
    text:   { type: String, required: true },
    link:   { type: String, required: true }, // navigate here on click
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
