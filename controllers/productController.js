import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import fs from "fs";
import orderModel from "../models/orderModel.js";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";

dotenv.config();

//payment gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //validation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "photo is Required and should be less then 1mb" });
    }

    const products = new productModel({
      ...req.fields,
      slug: slugify(name),
      originalPrice: price, // Set originalPrice same as price initially
    });

    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Created Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating product",
    });
  }
};

//get all products
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .populate("discount.offer")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });

    // Add discountedPrice to each product
    const productsWithDiscount = products.map((product) => {
      const productObj = product.toObject();
      productObj.discountedPrice = product.discountedPrice;
      productObj.hasActiveDiscount = product.hasActiveDiscount;
      return productObj;
    });

    res.status(200).send({
      success: true,
      counTotal: products.length,
      message: "All Products ",
      products: productsWithDiscount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting products",
      error: error.message,
    });
  }
};

// get single product
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category")
      .populate("discount.offer");

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    // Add discounted price information
    const productObj = product.toObject();
    productObj.discountedPrice = product.discountedPrice;
    productObj.hasActiveDiscount = product.hasActiveDiscount;

    res.status(200).send({
      success: true,
      message: "Single Product Fetched",
      product: productObj,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single product",
      error,
    });
  }
};

// get photo
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (product.photo.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting photo",
      error,
    });
  }
};

//delete controller
export const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid).select("-photo");
    res.status(200).send({
      success: true,
      message: "Product Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting product",
      error,
    });
  }
};

//update product
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } =
      req.fields;
    const { photo } = req.files;
    //validation
    switch (true) {
      case !name:
        return res.status(500).send({ error: "Name is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !price:
        return res.status(500).send({ error: "Price is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !quantity:
        return res.status(500).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res
          .status(500)
          .send({ error: "photo is Required and should be less then 1mb" });
    }

    // Get current product to preserve originalPrice if it exists
    const currentProduct = await productModel.findById(req.params.pid);
    const updateData = {
      ...req.fields,
      slug: slugify(name),
      originalPrice: currentProduct.originalPrice || price,
    };

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      updateData,
      { new: true }
    );

    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }

    await products.save();
    res.status(201).send({
      success: true,
      message: "Product Updated Successfully",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Update product",
    });
  }
};

// filters
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio, onSale } = req.body;
    let args = {};
    if (checked.length > 0) args.category = checked;
    if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };
    if (onSale) args.onSale = true;

    const products = await productModel
      .find(args)
      .populate("category")
      .populate("discount.offer");

    // Add discountedPrice to each product
    const productsWithDiscount = products.map((product) => {
      const productObj = product.toObject();
      productObj.discountedPrice = product.discountedPrice;
      productObj.hasActiveDiscount = product.hasActiveDiscount;
      return productObj;
    });

    res.status(200).send({
      success: true,
      products: productsWithDiscount,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error While Filtering Products",
      error,
    });
  }
};

// product count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({
      success: true,
      total,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      message: "Error in product count",
      error,
      success: false,
    });
  }
};

// product list base on page
export const productListController = async (req, res) => {
  try {
    const perPage = 12;
    const page = req.params.page ? req.params.page : 1;
    const products = await productModel
      .find({})
      .select("-photo")
      .populate("category")
      .populate("discount.offer")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    // Add discountedPrice to each product
    const productsWithDiscount = products.map((product) => {
      const productObj = product.toObject();
      productObj.discountedPrice = product.discountedPrice;
      productObj.hasActiveDiscount = product.hasActiveDiscount;
      return productObj;
    });

    res.status(200).send({
      success: true,
      products: productsWithDiscount,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error in per page ctrl",
      error,
    });
  }
};

// search product
export const searchProductController = async (req, res) => {
  try {
    const { keyword } = req.params;
    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo")
      .populate("category")
      .populate("discount.offer");

    // Add discountedPrice to each product
    const productsWithDiscount = results.map((product) => {
      const productObj = product.toObject();
      productObj.discountedPrice = product.discountedPrice;
      productObj.hasActiveDiscount = product.hasActiveDiscount;
      return productObj;
    });

    res.json(productsWithDiscount);
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error In Search Product API",
      error,
    });
  }
};

// similar products
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({
        category: cid,
        _id: { $ne: pid },
      })
      .select("-photo")
      .limit(4)
      .populate("category")
      .populate("discount.offer");

    // Add discountedPrice to each product
    const productsWithDiscount = products.map((product) => {
      const productObj = product.toObject();
      productObj.discountedPrice = product.discountedPrice;
      productObj.hasActiveDiscount = product.hasActiveDiscount;
      return productObj;
    });

    res.status(200).send({
      success: true,
      products: productsWithDiscount,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "error while getting related product",
      error,
    });
  }
};

// get product by category
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    const products = await productModel
      .find({ category })
      .populate("category")
      .populate("discount.offer");

    // Add discountedPrice to each product
    const productsWithDiscount = products.map((product) => {
      const productObj = product.toObject();
      productObj.discountedPrice = product.discountedPrice;
      productObj.hasActiveDiscount = product.hasActiveDiscount;
      return productObj;
    });

    res.status(200).send({
      success: true,
      category,
      products: productsWithDiscount,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      error,
      message: "Error While Getting products",
    });
  }
};

// Get products with active discounts
export const getDiscountedProductsController = async (req, res) => {
  try {
    const products = await productModel
      .find({ onSale: true })
      .populate("category")
      .populate("discount.offer")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });

    // Filter products with active discounts
    const activeDiscountedProducts = products.filter(
      (product) => product.hasActiveDiscount
    );

    // Add discountedPrice to each product
    const productsWithDiscount = activeDiscountedProducts.map((product) => {
      const productObj = product.toObject();
      productObj.discountedPrice = product.discountedPrice;
      productObj.hasActiveDiscount = product.hasActiveDiscount;
      return productObj;
    });

    res.status(200).send({
      success: true,
      countTotal: productsWithDiscount.length,
      message: "Discounted Products",
      products: productsWithDiscount,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting discounted products",
      error: error.message,
    });
  }
};

// Apply discount to product
export const applyProductDiscountController = async (req, res) => {
  try {
    const { discountType, discountValue, offerId, endDate } = req.body;

    const product = await productModel.findById(req.params.pid);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    product.applyDiscount(discountType, discountValue, offerId, endDate);
    await product.save();

    res.status(200).send({
      success: true,
      message: "Discount applied successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while applying discount",
      error,
    });
  }
};

// Remove discount from product
export const removeProductDiscountController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid);
    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    product.removeDiscount();
    await product.save();

    res.status(200).send({
      success: true,
      message: "Discount removed successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while removing discount",
      error,
    });
  }
};

//payment gateway api
//token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) {
        res.status(500).send(err);
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

//payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    let total = 0;

    // Calculate total using discounted prices if available
    for (const item of cart) {
      const product = await productModel.findById(item._id);
      if (product && product.hasActiveDiscount) {
        total += product.discountedPrice * item.quantity;
      } else {
        total += item.price * item.quantity;
      }
    }

    let newTransaction = gateway.transaction.sale(
      {
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      },
      function (error, result) {
        if (result) {
          const order = new orderModel({
            products: cart,
            payment: result,
            buyer: req.user._id,
          }).save();
          res.json({ ok: true });
        } else {
          res.status(500).send(error);
        }
      }
    );
  } catch (error) {
    console.log(error);
  }
};
 