import express from "express";
import {
  registerController,
  loginController,
  testController,
  forgotPasswordController,
  refreshTokenController,
  updateProfileController,
  getOrdersController,
  getAllOrdersController,
} from "../controllers/authController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import { loginLimiter } from "../middlewares/loginLimiter.js"; // Correct import

const router = express.Router();

// Routing
// REGISTER || METHOD POST
router.post("/register", registerController);

// LOGIN || POST with loginLimiter middleware
router.post("/login", loginLimiter, loginController); // Use loginLimiter here

// Forgot Password || POST
router.post("/forgot-password", forgotPasswordController);

// Refresh Token || POST
router.post("/refresh-token", refreshTokenController);

// Test routes
router.get("/test", requireSignIn, isAdmin, testController);

// Protected User route auth
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

// Protected Admin route auth
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

// Update profile
router.put("/profile", requireSignIn, updateProfileController);

//orders

router.get("/orders", requireSignIn, getOrdersController);

//all orders
router.get("/all-orders", requireSignIn, isAdmin, getAllOrdersController);

export default router;
