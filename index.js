import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgan from "morgan";
import connectDB from "./confiq/db.js";
import authRoutes from "./routes/authRoute.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";
import logger from "./middlewares/logger.js";
import errorHandler from "./middlewares/errorHandler.js"; // Import the errorHandler

// Configure environment variables
dotenv.config();

// Database connection
connectDB();

// Initialize express app
const app = express();

// List of allowed origins
const allowedOrigins = [
  "https://denapaona-com-webapp-server.vercel.app",
  "https://another-frontend-url.com",
  "http://localhost:3000", // For local development
];

// Middleware setup
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (e.g., mobile apps, curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: "GET,POST,PUT,DELETE",
  allowedHeaders: "Content-Type,Authorization,x-api-key",
}));
app.use(express.json());
app.use(morgan("dev"));
app.use(logger);

// Route handlers
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/category", categoryRoutes);
app.use("/api/v1/product", productRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("<h1>Welcome to ecommerce app</h1>");
});

// Error handling middleware (should be added after all other middleware and routes)
app.use(errorHandler);

// Define the port to run the server on
const PORT = process.env.PORT || 8080;

// Start the server
app.listen(PORT, () => {
  console.log(
    `Server Running in ${process.env.DEV_MODE} mode on port ${PORT}`.bgCyan
      .white
  );
});
