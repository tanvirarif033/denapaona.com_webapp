// middlewares/authMiddleware.js
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

/**
 * Accepts Authorization header as:
 *  - "Bearer <token>"  OR
 *  - "<token>" (raw)
 * Verifies JWT, loads user, sets req.user = { _id, name, role }.
 */
export const requireSignIn = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    let token = authHeader;

    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: "Authorization required" });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded._id).select("_id name role").lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = { _id: user._id.toString(), name: user.name, role: user.role };
    next();
  } catch (error) {
    console.log("requireSignIn error:", error?.message || error);
    return res.status(401).json({ success: false, message: "Unauthorized access" });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    if (req?.user?.role === 1) return next();
    const user = await userModel.findById(req.user?._id).select("role").lean();
    if (user?.role !== 1) {
      return res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
    }
    next();
  } catch (error) {
    console.log("isAdmin error:", error?.message || error);
    return res.status(500).json({ success: false, message: "Error in admin middleware" });
  }
};

export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey && apiKey === process.env.API_KEY) return next();
  return res.status(403).json({ error: "Forbidden: Invalid API Key" });
};
