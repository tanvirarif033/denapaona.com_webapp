// routes/reviewRoutes.js
import express from "express";
import {
  addReviewController,
  getReviewsController,
  getAllReviewsController,
  addReplyController,
  deleteReviewController,
} from "../controllers/reviewController.js";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Add a review (Protected route)
router.post("/add-review", requireSignIn, addReviewController);

// Get all reviews for a product
router.get("/product-reviews/:productId", getReviewsController);

// Get all reviews (Admin route)
router.get("/all-reviews", requireSignIn, isAdmin, getAllReviewsController);

// Add a reply to a review (Admin route)
router.put(
  "/reply-review/:reviewId",
  requireSignIn,
  isAdmin,
  addReplyController
);

// Delete a review (admin only)
router.delete(
  "/delete-review/:reviewId",
  requireSignIn,
  deleteReviewController
);

export default router;
