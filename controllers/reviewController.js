import { Review } from "../models/reviewModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";

// Add a review
export const addReviewController = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    const review = new Review({
      product: productId,
      user: req.user._id,
      rating,
      comment,
    });

    await review.save();
    res.status(201).json({ message: "Review added successfully", review });
  } catch (error) {
    console.error("Error adding review:", error);
    res
      .status(500)
      .json({ message: "Error adding review", error: error.message });
  }
};

// Get all reviews for a product
export const getReviewsController = async (req, res) => {
  try {
    const productId = req.params.productId;
    console.log(`Fetching reviews for product ID: ${productId}`);

    const reviews = await Review.find({ product: productId }).populate(
      "user",
      "name"
    );

    if (!reviews.length) {
      return res.status(404).json({
        success: false,
        message: "No reviews found for this product.",
      });
    }

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: error.message });
  }
};

// Fetch all reviews (admin)
export const getAllReviewsController = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate("user", "name") // Populate user names
      .select("comment reply"); // Select necessary fields

    res.status(200).json({ success: true, reviews });
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    res
      .status(500)
      .json({ message: "Error fetching all reviews", error: error.message });
  }
};

// Admin reply to a review
export const addReplyController = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.reply = reply;
    await review.save();

    res.status(200).json({ message: "Reply added successfully", review });
  } catch (error) {
    console.error("Error adding reply:", error);
    res
      .status(500)
      .json({ message: "Error adding reply", error: error.message });
  }
};

export const deleteReviewController = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Check if the user is the owner or an admin
    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 1; // Assuming role 1 is admin

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this review" });
    }

    await review.deleteOne();
    res
      .status(200)
      .json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res
      .status(500)
      .json({ message: "Error deleting review", error: error.message });
  }
};
