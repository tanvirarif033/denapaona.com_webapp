// routes/chatRoutes.js
import express from "express";
import formidable from "express-formidable";
import {
  ensureUserRoom,
  listRoomsForAdmin,
  getAllRooms,
  getRoomMessages,
  uploadChatImage,
} from "../controllers/chatController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

// current user's chat room (non-admin user)
router.get("/rooms/me", requireSignIn, ensureUserRoom);

// admin-only: list rooms
router.get("/rooms/admin", requireSignIn, listRoomsForAdmin);

// admin-only: all rooms (kept for compatibility)
router.get("/rooms", requireSignIn, getAllRooms);

// messages of a specific room
router.get("/rooms/:roomId/messages", requireSignIn, getRoomMessages);

// image upload (multipart/form-data, field name: "image")
router.post("/upload", requireSignIn, formidable(), uploadChatImage);

export default router;
