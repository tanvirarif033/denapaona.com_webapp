
import express from "express";
import {
  createReturnRequest,
  myReturnRequests,
  allReturnRequests,
  decideReturnRequest,
  completeReturnRequest,
} from "../controllers/returnController.js";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/:orderId", requireSignIn, createReturnRequest);
router.get("/my", requireSignIn, myReturnRequests);

router.get("/", requireSignIn, isAdmin, allReturnRequests);
router.put("/:id/decision", requireSignIn, isAdmin, decideReturnRequest);
router.put("/:id/complete", requireSignIn, isAdmin, completeReturnRequest);

export default router;
