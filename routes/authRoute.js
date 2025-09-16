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
  orderStatusController,
  googleLoginController, // NEW
} from "../controllers/authController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import { loginLimiter } from "../middlewares/loginLimiter.js";

const router = express.Router();

router.post("/register", registerController);
router.post("/login", loginLimiter, loginController);
router.post("/forgot-password", forgotPasswordController);
router.post("/refresh-token", refreshTokenController);

// NEW:
router.post("/google", googleLoginController);

router.get("/test", requireSignIn, isAdmin, testController);
router.get("/user-auth", requireSignIn, (req, res) => res.status(200).send({ ok: true }));
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => res.status(200).send({ ok: true }));
router.put("/profile", requireSignIn, updateProfileController);
router.get("/orders", requireSignIn, getOrdersController);
router.get("/all-orders", requireSignIn, isAdmin, getAllOrdersController);
router.put("/order-status/:orderId", requireSignIn, isAdmin, orderStatusController);


router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token required" });
    }
    const decoded = JWT.verify(refreshToken, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded._id).select("_id name email role").lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    const newToken = JWT.sign(
      { _id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      token: newToken,
      refreshToken, // Reuse existing refresh token or generate new
    });
  } catch (error) {
    console.error("Refresh token error:", error.message);
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
});

export default router;
