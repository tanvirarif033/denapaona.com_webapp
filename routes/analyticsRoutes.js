// routes/analyticsRoutes.js
import express from "express";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";
import {
  salesSummaryController,
  salesTimeSeriesController,
  topProductsController,
  topCategoriesController,
} from "../controllers/analyticsController.js";

const router = express.Router();

// protect with admin guard (matches your AdminRoute pattern)
router.get("/summary", requireSignIn, isAdmin, salesSummaryController);
router.get("/timeseries", requireSignIn, isAdmin, salesTimeSeriesController);
router.get("/top-products", requireSignIn, isAdmin, topProductsController);
router.get("/top-categories", requireSignIn, isAdmin, topCategoriesController);

export default router;
