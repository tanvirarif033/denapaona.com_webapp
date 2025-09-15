// routes/offerRoutes.js
import express from "express";
import {
  createOfferController,
  deleteOfferController,
  getAllOffersController,
  getActiveOffersController,
  getProductsByCategoryController,
  getSingleOfferController,
  offerBannerController,
  updateOfferController,
} from "../controllers/offerController.js";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import formidable from "express-formidable";

const router = express.Router();

// Routes
router.post(
  "/create-offer",
  requireSignIn,
  isAdmin,
  formidable(),
  createOfferController
);

router.put(
  "/update-offer/:oid",
  requireSignIn,
  isAdmin,
  formidable(),
  updateOfferController
);

router.get("/get-offers", getAllOffersController);

router.get("/get-active-offers", getActiveOffersController);

router.get("/get-offer/:oid", getSingleOfferController);

router.get("/offer-banner/:oid", offerBannerController);

router.delete(
  "/delete-offer/:oid",
  requireSignIn,
  isAdmin,
  deleteOfferController
);

router.get(
  "/products-by-category/:cid",
  requireSignIn,
  isAdmin,
  getProductsByCategoryController
);


export default router;
