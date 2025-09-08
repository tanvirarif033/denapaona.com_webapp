// routes/notificationRoutes.js
import express from "express";
import { requireSignIn } from "../middlewares/authMiddleware.js";
import { getMyNotifications, markAllRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", requireSignIn, getMyNotifications);
router.put("/read-all", requireSignIn, markAllRead);

export default router;
