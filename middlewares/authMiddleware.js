import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";


// Protected Routes token based
export const requireSignIn = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).send({ success: false, message: "Authorization required" });
    }
    const decode = JWT.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    console.log(error);
    return res.status(401).send({
      success: false,
      message: "Unauthorized access",
    });
  }
};

// Admin access

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

//API key Validation
 export const validateApiKey = (req, res, next) => {
  console.log("API Key from request headers:", req.headers['x-api-key']);
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === process.env.API_KEY) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }
};
