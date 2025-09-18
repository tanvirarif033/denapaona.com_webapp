// controllers/authController.js
import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import Notification from "../models/Notification.js";
import productModel from "../models/productModel.js";
import { OAuth2Client } from "google-auth-library"; // NEW
import { sendOrderDelivered } from "../utils/email.js"
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// -------------------- REGISTER --------------------
export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;
    if (!name || !email || !password || !phone || !address || !answer) {
      return res.status(400).send({ message: "All fields are required" });
    }
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send({
        success: true,
        message: "Already Registered. Please login.",
      });
    }
    const hashedPassword = await hashPassword(password);
    const user = await new userModel({
      name, email, phone, address, password: hashedPassword, answer,
    }).save();

    res.status(201).send({ success: true, message: "User Registered Successfully", user });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error in Registration", error });
  }
};

// -------------------- TOKENS --------------------
const createRefreshToken = (user) =>
  JWT.sign({ _id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

// -------------------- LOGIN (email/password) --------------------
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send({ success: false, message: "Invalid email or password" });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).send({ success: false, message: "Email is not registered" });

    const match = await comparePassword(password, user.password);
    if (!match) return res.status(400).send({ success: false, message: "Invalid Password" });

    const refreshToken = createRefreshToken(user);
    const token = JWT.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });

    res.status(200).send({
      success: true,
      message: "Login successful",
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role },
      token,
      refreshToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error in login", error });
  }
};

// -------------------- REFRESH TOKEN --------------------
export const refreshTokenController = (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(403).send({ success: false, message: "Refresh token is required" });

  try {
    const user = JWT.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = JWT.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "15s" });
    const newRefreshToken = createRefreshToken(user);
    return res.status(200).json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.log(error);
    return res.status(403).send({ success: false, message: "Invalid refresh token", error });
  }
};

// -------------------- TEST --------------------
export const testController = (req, res) => {
  try { res.send("Protected Routes"); } catch (error) { console.log(error); res.send({ error }); }
};

// -------------------- FORGOT PASSWORD --------------------
export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    if (!email || !answer || !newPassword) return res.status(400).send({ message: "All fields are required" });
    const user = await userModel.findOne({ email, answer });
    if (!user) return res.status(404).send({ success: false, message: "Wrong Email Or Answer" });

    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({ success: true, message: "Password Reset Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Something went wrong", error });
  }
};

// -------------------- UPDATE PROFILE --------------------
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const user = await userModel.findById(req.user._id);
    if (password && password.length < 6)
      return res.status(400).json({ error: "Password is required and must be at least 6 characters long" });

    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      { name: name || user.name, password: hashedPassword || user.password, phone: phone || user.phone, address: address || user.address },
      { new: true }
    );
    res.status(200).send({ success: true, message: "Profile Updated Successfully", updatedUser });
  } catch (error) {
    console.log(error);
    res.status(400).send({ success: false, message: "Error While Updating Profile", error });
  }
};

// -------------------- GET ORDERS (USER) --------------------
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel.find({ buyer: req.user._id }).populate("products", "-photo").populate("buyer", "name");
    res.status(200).json({ success: true, message: "Orders fetched successfully", orders });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error While Fetching Orders", error });
  }
};

// -------------------- GET ALL ORDERS (ADMIN) --------------------
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate({ path: "products", select: "-photo" })
      .populate({ path: "buyer", select: "name" })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: "Orders fetched successfully", orders });
  } catch (error) {
    console.error("Error while fetching orders:", error.message);
    res.status(500).json({ success: false, message: "Error while fetching orders", error: error.message });
  }
};

// -------------------- ORDER STATUS + NOTIFY + (NEW) DELIVERED MAIL --------------------
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // 1) Update status 
    const order = await orderModel
      .findByIdAndUpdate(orderId, { status }, { new: true })
      .populate("buyer", "name _id");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    
    let firstName = "your product";
    let more = 0;

    if (Array.isArray(order?.products) && order.products.length) {
      more = Math.max(order.products.length - 1, 0);
      const firstId = order.products[0];
      if (firstId && typeof firstId === "object") {
        const prod = await productModel.findById(firstId).select("name").lean();
        if (prod?.name) firstName = prod.name;
      }
    }

    const label = more > 0 ? `${firstName} (+${more} more)` : firstName;
    const statusMap = {
      "Not Process": "Not Process",
      Processing: "Processing",
      Shipped: "Shipped",
      deliverd: "Delivered", 
      cancel: "Cancelled",
    };
    const prettyStatus = statusMap[status] || status;

    const title = `Order ${prettyStatus}`;
    const text = `Your ${label} is ${prettyStatus}`;
    const link = "/dashboard/user/orders";

    if (order?.buyer?._id) {
      const n = await Notification.create({ toUser: order.buyer._id, title, text, link });
      const io = req.app.get("io");
      io.to(`user:${order.buyer._id}`).emit("notification:new", {
        _id: n._id, title, text, link, createdAt: n.createdAt,
      });
    }

    // 3) ✅ NEW: Delivered (বা deliverd) হলে ইমেইল পাঠানো
    const s = String(status).toLowerCase();
    const isDelivered = s === "delivered" || s === "deliverd";
    if (isDelivered) {
      try {
        // buyer-এর ইমেইল দরকার, তাই আলাদা করে email সহ populate করি
        const populated = await orderModel
          .findById(orderId)
          .populate({ path: "buyer", select: "name email" })
          .lean();

        const to = populated?.buyer?.email || "";
        const name = populated?.buyer?.name || "";

        // ইমেইল valid হলে পাঠাই
        if (to && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
          const clientBase = process.env.CLIENT_URL || "http://localhost:3000";
          const reviewLink = `${clientBase}/dashboard/user/orders`;

          await sendOrderDelivered({
            to,
            name,
            orderId,
            deliveredAt: new Date(),
            reviewLink,
          });
        
        }
      } catch (err) {
        // ইমেইল ব্যর্থ হলেও API রেসপন্স আগের মতোই থাকবে
        console.log("Delivery email error:", err?.message || String(err));
      }
    }

    // 4) আগের মতোই রেসপন্স
    return res
      .status(200)
      .json({ success: true, message: "Order status updated successfully", order });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ success: false, message: "Error While Updating Order", error });
  }
};

// -------------------- GOOGLE SIGN-IN --------------------
export const googleLoginController = async (req, res) => {
  try {
    const { credential } = req.body; // id_token from client
    if (!credential) return res.status(400).json({ success: false, message: "Missing Google credential" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub, email_verified } = payload || {};
    if (!email || email_verified === false)
      return res.status(403).json({ success: false, message: "Unverified Google account" });

    let user = await userModel.findOne({ email });
    if (!user) {
      const hashed = await hashPassword(`${sub}${process.env.JWT_SECRET}`);
      user = await new userModel({
        name: name || email.split("@")[0],
        email,
        password: hashed,
        phone: "N/A",
        address: "Google Sign-in",
        answer: "google-oauth",
      }).save();
    }

    const refreshToken = JWT.sign({ _id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
    const token = JWT.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role },
      token,
      refreshToken,
    });
  } catch (err) {
    console.error("googleLoginController error:", err?.message || err);
    return res.status(500).json({ success: false, message: "Google login failed", error: err?.message });
  }
};
