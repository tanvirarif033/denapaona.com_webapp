import express from "express";
import {
  registerController,
   loginController,
   testController,
   forgotPasswordController,
   refreshTokenController,

} from "../controllers/authController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import { loginLimiter } from "../middlewares/loginLimiter.js"; // Correct import

const router = express.Router();

//routing
//REGISTER || METHOD POST
router.post("/register", registerController);

//LOGIN || POST with loginLimiter middleware
router.post("/login", loginLimiter, loginController); // Use loginLimiter here

//Forgot Password || POST
router.post("/forgot-password", forgotPasswordController);

router.post("/refresh-token", refreshTokenController);
//test routes
router.get("/test", requireSignIn, isAdmin, testController);

//protected User route auth
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});

//protected Admin route auth
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});

export default router;
