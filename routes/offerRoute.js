import express from "express";
import {
  createOfferController,
  getOffersController,
  getActiveOffersController,
  getSingleOfferController,
  updateOfferController,
  deleteOfferController,
  applyOfferToProductsController,
  removeOfferFromProductsController,
  getProductsByOfferController,
  checkOfferValidityController,
  getOffersByStatusController,
} from "../controllers/offerController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create offer - ADMIN ONLY
router.post("/create-offer", requireSignIn, isAdmin, createOfferController);

// Get all offers with pagination - PUBLIC
router.get("/get-offer", getOffersController);

// Get offers by status - PUBLIC
router.get("/get-offer/status/:status", getOffersByStatusController);

// Get active offers for carousel - PUBLIC
router.get("/active-offers", getActiveOffersController);

// Get single offer by slug - PUBLIC
router.get("/get-offer/:slug", getSingleOfferController);

// Update offer - ADMIN ONLY
router.put("/update-offer/:oid", requireSignIn, isAdmin, updateOfferController);

// Delete offer - ADMIN ONLY
router.delete(
  "/delete-offer/:oid",
  requireSignIn,
  isAdmin,
  deleteOfferController
);

// Apply offer to products - ADMIN ONLY
router.post(
  "/apply-to-products",
  requireSignIn,
  isAdmin,
  applyOfferToProductsController
);

// Remove offer from products - ADMIN ONLY
router.post(
  "/remove-from-products",
  requireSignIn,
  isAdmin,
  removeOfferFromProductsController
);

// Get products by offer ID - PUBLIC
router.get("/offer-products/:oid", getProductsByOfferController);

// Check offer validity - PUBLIC
router.get("/check-validity/:oid", checkOfferValidityController);

export default router;
