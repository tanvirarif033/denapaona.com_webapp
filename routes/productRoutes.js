import express from "express";
import {
  applyProductDiscountController,
  brainTreePaymentController,
  braintreeTokenController,
  createProductController,
  deleteProductController,
  getDiscountedProductsController,
  getProductController,
  getSingleProductController,
  productCategoryController,
  productCountController,
  productFiltersController,
  productListController,
  productPhotoController,
  realtedProductController,
  removeProductDiscountController,
  searchProductController,
  updateProductController,
  getDiscountedProductsController,
  applyProductDiscountController,
  removeProductDiscountController,
  getProductsByOfferController,
} from "../controllers/productController.js";
import {
  isAdmin,
  requireSignIn,
  validateApiKey,
} from "../middlewares/authMiddleware.js";
import formidable from "express-formidable";

const router = express.Router();

//routes
router.post(
  "/create-product",
  requireSignIn,
  isAdmin,
  formidable(),
  createProductController
);

//routes
router.put(
  "/update-product/:pid",
  requireSignIn,
  isAdmin,
  formidable(),
  updateProductController
);

//get products
router.get("/get-product", validateApiKey, getProductController);

//single product
router.get("/get-product/:slug", validateApiKey, getSingleProductController);

//get photo
router.get("/product-photo/:pid", productPhotoController);

//delete product
router.delete(
  "/delete-product/:pid",
  requireSignIn,
  isAdmin,
  deleteProductController
);

//filter product
router.post("/product-filters", productFiltersController);

//product count
router.get("/product-count", validateApiKey, productCountController);

//product per page
router.get("/product-list/:page", validateApiKey, productListController);

//search product
router.get("/search/:keyword", searchProductController);

//category wise product
router.get(
  "/product-category/:slug",
  validateApiKey,
  productCategoryController
);

//similar product
router.get("/related-product/:pid/:cid", realtedProductController);

// Get discounted products
router.get(
  "/discounted-products",
  validateApiKey,
  getDiscountedProductsController
);

// Apply discount to product
router.post(
  "/apply-discount/:pid",
  requireSignIn,
  isAdmin,
  applyProductDiscountController
);

// Remove discount from product
router.delete(
  "/remove-discount/:pid",
  requireSignIn,
  isAdmin,
  removeProductDiscountController
);

//payments routes
//token
router.get("/braintree/token", braintreeTokenController);

//payments
router.post("/braintree/payment", requireSignIn, brainTreePaymentController);

export default router;
