import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Function to verify access token
const verifyAccessToken = (token) => {
  return new Promise((resolve, reject) => {
    JWT.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

// Middleware for verifying access token and attaching user to request
export const requireSignIn = async (req, res, next) => {
  try {
    // Extract token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send({ message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];

    // Verify access token
    const decoded = await verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    res.status(401).send({ message: "Invalid access token" });
  }
};

// Middleware for verifying admin access
export const isAdmin = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id);
    if (!user || user.role !== 1) {
      return res.status(403).send({
        success: false,
        message: "Unauthorized access",
      });
    }
    next();
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Error in admin middleware" });
  }
};
