// routes/chatRoutes.js
import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import upload from "../utils/chatUpload.js";
import {
  ensureUserRoom,
  listRoomsForAdmin,
  getRoomMessages,
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/rooms/me", requireSignIn, ensureUserRoom);
router.get(
  "/rooms",
  requireSignIn,
  (req, res, next) => {
    if (req.user?.role !== 1) return res.status(403).json({ message: "Forbidden" });
    next();
  },
  listRoomsForAdmin
);
router.get("/rooms/:roomId/messages", requireSignIn, getRoomMessages);
router.post("/upload", requireSignIn, upload.single("image"), (req, res) => {
  res.json({ url: `/uploads/chat/${req.file.filename}` });
});

// ✅ THIS is the important part:
export default router;
