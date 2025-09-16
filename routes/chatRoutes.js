import express from "express";
import { 
  ensureUserRoom, 
  listRoomsForAdmin, 
  getRoomMessages, 
  getAllRooms 
} from "../controllers/chatController.js";
import { requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/rooms/me", requireSignIn, ensureUserRoom);
router.get("/rooms/admin", requireSignIn, listRoomsForAdmin);
router.get("/rooms", requireSignIn, getAllRooms); // Added this route
router.get("/rooms/:roomId/messages", requireSignIn, getRoomMessages);

export default router;