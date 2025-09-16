import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import fs from "fs";
import orderModel from "../models/orderModel.js";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";
import userModel from "../models/userModel.js";
import Notification from "../models/Notification.js";
import { sendOrderConfirmation } from "../utils/email.js";

dotenv.config();

/* ==================== BRAINTREE GATEWAY ==================== */
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

/* ==================== helpers ==================== */

// populate only currently active offers
const activeOffersPopulate = {
  path: "offers",
  match: {
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  },
};

// compute effective (discounted) price for a product doc with populated offers
function computeDiscountedPrice(p) {
  const base = Number(p?.price || 0);
  const offers = Array.isArray(p?.offers) ? p.offers : [];
  if (!offers.length) return base;

  const o = offers[0];
  if (o?.discountType === "percentage") {
    return Math.max(0, base * (1 - Number(o.discountValue || 0) / 100));
  }
  if (o?.discountType === "fixed") {
    return Math.max(0, base - Number(o.discountValue || 0));
  }
  // for bogo or unknown types, charge base price (quantity rules may apply client-side)
  return base;
}

/* ==================== create product ==================== */
export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } = req.fields;
    const { photo } = req.files;

    switch (true) {
      case !name: return res.status(500).send({ error: "Name is Required" });
      case !description: return res.status(500).send({ error: "Description is Required" });
      case !price: return res.status(500).send({ error: "Price is Required" });
      case !category: return res.status(500).send({ error: "Category is Required" });
      case !quantity: return res.status(500).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res.status(500).send({ error: "photo is Required and should be less then 1mb" });
    }

    const products = new productModel({ ...req.fields, slug: slugify(name) });
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
    res.status(500).send({ success: false, error, message: "Error in creating product" });
  }
};

/* ==================== get all (first page) ==================== */
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .populate(activeOffersPopulate)
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      counTotal: products.length,
      message: "All Products",
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error in getting products", error: error.message });
  }
};

/* ==================== single product ==================== */
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category")
      .populate(activeOffersPopulate);

    res.status(200).send({ success: true, message: "Single Product Fetched", product });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error while getting single product", error });
  }
};

/* ==================== image ==================== */
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (product?.photo?.data) {
      res.set("Content-type", product.photo.contentType);
      return res.status(200).send(product.photo.data);
    }
    res.status(404).send({ success: false });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error while getting photo", error });
  }
};

/* ==================== delete ==================== */
export const deleteProductController = async (req, res) => {
  try {
    await productModel.findByIdAndDelete(req.params.pid).select("-photo");
    res.status(200).send({ success: true, message: "Product Deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Error while deleting product", error });
  }
};

/* ==================== update ==================== */
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } = req.fields;
    const { photo } = req.files;

    switch (true) {
      case !name: return res.status(500).send({ error: "Name is Required" });
      case !description: return res.status(500).send({ error: "Description is Required" });
      case !price: return res.status(500).send({ error: "Price is Required" });
      case !category: return res.status(500).send({ error: "Category is Required" });
      case !quantity: return res.status(500).send({ error: "Quantity is Required" });
      case photo && photo.size > 1000000:
        return res.status(500).send({ error: "photo is Required and should be less then 1mb" });
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name) },
      { new: true }
    );
    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.type;
    }
    await products.save();
    res.status(201).send({ success: true, message: "Product Updated Successfully", products });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, error, message: "Error in update product" });
  }
};

/* ==================== filters ==================== */
export const productFiltersController = async (req, res) => {
  try {
    const { checked, radio } = req.body;
    let args = {};
    if (checked?.length > 0) args.category = checked;
    if (radio?.length) args.price = { $gte: radio[0], $lte: radio[1] };
    const products = await productModel.find(args);
    res.status(200).send({ success: true, products });
  } catch (error) {
    console.log(error);
    res.status(400).send({ success: false, message: "Error While Filtering Products", error });
  }
};

/* ==================== count ==================== */
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.find({}).estimatedDocumentCount();
    res.status(200).send({ success: true, total });
  } catch (error) {
    console.log(error);
    res.status(400).send({ message: "Error in product count", error, success: false });
  }
};

/* ==================== list by page (includes active offers) ==================== */
export const productListController = async (req, res) => {
  try {
    const perPage = 12;
    const page = req.params.page ? parseInt(req.params.page, 10) : 1;

    const products = await productModel
      .find({})
      .select("-photo")
      .populate("category")
      .populate(activeOffersPopulate)
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.status(200).send({ success: true, products });
  } catch (error) {
    console.log(error);
    res.status(400).send({ success: false, message: "error in per page ctrl", error });
  }
};

/* ==================== search ==================== */
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
      .select("-photo");
    res.json(results);
  } catch (error) {
    console.log(error);
    res.status(400).send({ success: false, message: "Error In Search Product API", error });
  }
};

/* ==================== related ==================== */
export const realtedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({ category: cid, _id: { $ne: pid } })
      .select("-photo")
      .populate("category")
      .populate(activeOffersPopulate)
      .limit(4);

    res.status(200).send({ success: true, products });
  } catch (error) {
    console.log(error);
    res.status(400).send({ success: false, message: "error while getting related product", error });
  }
};

/* ==================== by category ==================== */
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    const products = await productModel
      .find({ category })
      .populate("category")
      .populate(activeOffersPopulate);

    res.status(200).send({ success: true, category, products });
  } catch (error) {
    console.log(error);
    res.status(400).send({ success: false, error, message: "Error While Getting products" });
  }
};

/* ==================== braintree token ==================== */
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (err, response) {
      if (err) res.status(500).send(err);
      else res.send(response);
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Token error" });
  }
};

/* ==================== payment (secure pricing + email) ==================== */
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;

    // normalize incoming ids from client (keep duplicates if any)
    const ids = (cart || [])
      .map((p) => p?._id || p?.product?._id || p?.id || p?.pid)
      .filter(Boolean);

    // pull fresh products with active offers
    const dbProducts = await productModel
      .find({ _id: { $in: ids } })
      .populate(activeOffersPopulate)
      .lean();

    const priceMap = new Map(dbProducts.map((p) => [String(p._id), computeDiscountedPrice(p)]));
    const nameMap = new Map(dbProducts.map((p) => [String(p._id), p.name || "Product"]));

    let total = 0;
    const lineItems = [];

    // preserve duplicates + fallback to client price if not found in map
    for (const item of cart || []) {
      const id = String(item?._id || item?.product?._id || item?.id || item?.pid || "");
      const effective = priceMap.has(id)
        ? priceMap.get(id)
        : Number(item?.effectivePrice ?? item?.price ?? 0);
      const charge = Number(effective) || 0;
      total += charge;
      if (id) lineItems.push({ product: id, price: charge });
    }

    gateway.transaction.sale(
      {
        amount: total.toFixed(2),
        paymentMethodNonce: nonce,
        options: { submitForSettlement: true },
      },
      async (error, result) => {
        if (error) {
          console.log("Braintree error:", error);
          return res.status(500).send({ ok: false, message: "Payment failed" });
        }
        if (!result) {
          return res.status(500).send({ ok: false, message: "Unknown payment error" });
        }

        const order = await new orderModel({
          products: ids,
          items: lineItems,
          payment: result,
          buyer: req.user._id,
          status: "Not Process",
        }).save();

        // notify admins (optional, safe-guarded)
        try {
          const admins = await userModel.find({ role: 1 }).select("_id").lean();
          if (admins?.length) {
            const docs = admins.map((a) => ({
              toUser: a._id,
              title: "New order received",
              text: `${req.user?.name || "A user"} ordered ${(cart || []).length || 1} product(s)`,
              link: "/dashboard/admin/orders",
            }));
            await Notification.insertMany(docs);
          }
          const io = req.app.get("io");
          if (io?.to) {
            io.to("admins").emit("notification:new", {
              title: "New order received",
              text: `${req.user?.name || "A user"} ordered ${(cart || []).length || 1} product(s)`,
              link: "/dashboard/admin/orders",
              createdAt: new Date(),
            });
          }
        } catch (notifyErr) {
          console.log("Notify error:", notifyErr?.message || notifyErr);
        }

        // ===== email to buyer =====
        let emailSent = false;
        let emailError = "";
        try {
          const buyer = await userModel.findById(req.user._id).select("email name").lean();
          const ok = !!buyer?.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email);
          if (ok) {
            const itemsForEmail = lineItems.map((li) => ({
              name: nameMap.get(String(li.product)) || "Product",
              price: li.price,
            }));
            await sendOrderConfirmation({
              to: buyer.email,
              name: buyer.name,
              orderId: order._id,
              items: itemsForEmail,
              total,
              placedAt: order.createdAt,
            });
            emailSent = true;
          } else {
            emailError = "No valid buyer email on file";
          }
        } catch (mailErr) {
          console.log("Order email error:", mailErr?.message || mailErr);
          emailError = String(mailErr?.message || mailErr);
        }

        return res.json({ ok: true, orderId: order._id, emailSent, ...(emailSent ? {} : { emailError }) });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send({ ok: false, message: "Payment error" });
  }
};
