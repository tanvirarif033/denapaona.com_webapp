import express from "express";
import {
  registerController,
  loginController,
  testController,
  forgotPasswordController,
  logoutController,
} from "../controllers/authController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

// Create router object
const router = express.Router();

// Routes

// REGISTER || METHOD POST
router.post("/register", registerController);

// LOGIN || POST
router.post("/login", loginController);

// Forgot Password || POST
router.post("/forgot-password", forgotPasswordController);

// Test route (Protected, Admin Access)
router.get("/test", requireSignIn, isAdmin, testController);

// Protected route for authenticated users
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ message: "User authenticated successfully" });
});

// Protected route for admins
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ message: "Admin authenticated successfully" });
});

// Refresh Token || POST
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).send({ message: "Refresh token is required" });
  }

  try {
    const decoded = JWT.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await userModel.findById(decoded._id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const newAccessToken = generateAccessToken(user);
    res.status(200).send({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Error in refreshing token:", error);
    res.status(401).send({
      success: false,
      message: "Invalid refresh token",
      error: error.message,
    });
  }
});
// LOGOUT || POST
router.post("/logout", requireSignIn, logoutController);

export default router;
