import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";

// Function to generate access token
// Function to generate refresh token
const generateRefreshToken = (user) => {
  return JWT.sign({ _id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d", // Example: refresh token expires in 30 days
  });
};

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;
    // Validations
    if (!name || !email || !password || !phone || !address || !answer) {
      return res.status(400).send({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(200).send({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Save user to database
    const newUser = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
    }).save();

    // Generate tokens
    const token = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // Respond with success message and user details
    res.status(201).send({
      success: true,
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        role: newUser.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).send({
      success: false,
      message: "Error in user registration",
      error: error.message,
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .send({ message: "Email and password are required" });
    }

    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({ message: "Email is not registered" });
    }

    // Verify password
    const isPasswordMatch = await comparePassword(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).send({ message: "Invalid password" });
    }

    // Generate tokens
    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Respond with success message and user details
    res.status(200).send({
      success: true,
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    console.error("Error in user login:", error);
    res.status(500).send({
      success: false,
      message: "Error in user login",
      error: error.message,
    });
  }
};

export const testController = (req, res) => {
  try {
    res.send("Protected Routes");
  } catch (error) {
    console.error("Error in test controller:", error);
    res
      .status(500)
      .send({ message: "Error in test controller", error: error.message });
  }
};

export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;

    // Validate input
    if (!email || !answer || !newPassword) {
      return res
        .status(400)
        .send({ message: "Email, answer, and new password are required" });
    }

    // Check if user exists and answer is correct
    const user = await userModel.findOne({ email, answer });
    if (!user) {
      return res.status(404).send({ message: "Invalid email or answer" });
    }

    // Hash new password and update user
    const hashedPassword = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });

    // Respond with success message
    res
      .status(200)
      .send({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).send({
      success: false,
      message: "Error in password reset",
      error: error.message,
    });
  }
};

export const logoutController = async (req, res) => {
  try {
    const { userId } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).send({ message: "User ID is required" });
    }

    // Invalidate refresh token
    await userModel.findByIdAndUpdate(userId, { refreshToken: null });

    res.status(200).send({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("Error in user logout:", error);
    res.status(500).send({
      success: false,
      message: "Error in user logout",
      error: error.message,
    });
  }
};
