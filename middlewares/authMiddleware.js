// middlewares/authMiddleware.js
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// ✅ RAW token only (no Bearer)
export const requireSignIn = async (req, res, next) => {
  try {
    const token = req.headers.authorization; // raw token expected
    if (!token) {
      return res
        .status(401)
        .send({ success: false, message: "Authorization required" });
    }

    const decoded = JWT.verify(token, process.env.JWT_SECRET);

    const user = await userModel
      .findById(decoded._id)
      .select("_id name role")
      .lean();

    if (!user) {
      return res
        .status(401)
        .send({ success: false, message: "User not found" });
    }

    // attach minimal user
    req.user = { _id: user._id.toString(), name: user.name, role: user.role };
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      success: false,
      message: "Unauthorized access",
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (user.role !== 1) {
      return res.status(403).send({
        success: false,
        message: "Forbidden: Admin access required",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in admin middleware",
      error: error.message,
    });
  }
};

export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey && apiKey === process.env.API_KEY) {
    next();
  } else {
    res.status(403).json({ error: "Forbidden: Invalid API Key" });
  }
};
