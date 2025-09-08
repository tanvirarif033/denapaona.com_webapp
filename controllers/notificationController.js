// controllers/notificationController.js
import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  try {
    const items = await Notification.find({ toUser: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const countUnread = items.filter(n => !n.isRead).length;
    res.json({ success: true, items, countUnread });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to load notifications" });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { toUser: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
};
