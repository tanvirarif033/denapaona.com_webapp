import offerModel from "../models/offerModel.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

// Create offer controller
export const createOfferController = async (req, res) => {
  try {
    const {
      name,
      description,
      discountType,
      discountValue,
      applicableProducts,
      applicableCategories,
      startDate,
      endDate,
      isActive = true,
      minPurchaseAmount = 0,
      maxDiscountAmount,
      usageLimit,
    } = req.body;

    // Validation
    const errors = [];
    if (!name) errors.push("Name is Required");
    if (!description) errors.push("Description is Required");
    if (!discountType) errors.push("Discount Type is Required");
    if (!discountValue) errors.push("Discount Value is Required");
    if (!startDate) errors.push("Start Date is Required");
    if (!endDate) errors.push("End Date is Required");

    if (errors.length > 0) {
      return res.status(400).send({ error: errors.join(", ") });
    }

    // Validate discount value
    if (
      discountType === "percentage" &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      return res.status(400).send({
        error: "Percentage discount must be between 1 and 100",
      });
    }

    if (discountType === "fixed" && discountValue <= 0) {
      return res.status(400).send({
        error: "Fixed discount must be greater than 0",
      });
    }

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).send({
        error: "End date must be after start date",
      });
    }

    const offer = new offerModel({
      name,
      description,
      discountType,
      discountValue,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive,
      minPurchaseAmount,
      maxDiscountAmount: maxDiscountAmount || null,
      usageLimit: usageLimit || null,
      slug: slugify(name),
    });

    await offer.save();

    // Apply offer to applicable products if any
    if (applicableProducts && applicableProducts.length > 0) {
      await applyOfferToProducts(
        offer._id,
        applicableProducts,
        discountType,
        discountValue,
        endDate
      );
    }

    res.status(201).send({
      success: true,
      message: "Offer Created Successfully",
      offer,
    });
  } catch (error) {
    console.error("Create Offer Error:", error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in creating offer",
    });
  }
};

// Get all offers with pagination
export const getOffersController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const offers = await offerModel
      .find({})
      .populate("applicableProducts", "name price")
      .populate("applicableCategories", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await offerModel.countDocuments();

    res.status(200).send({
      success: true,
      countTotal: offers.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      message: "All Offers",
      offers,
    });
  } catch (error) {
    console.error("Get Offers Error:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting offers",
      error: error.message,
    });
  }
};

// Get active offers (for carousel)
export const getActiveOffersController = async (req, res) => {
  try {
    const currentDate = new Date();
    const offers = await offerModel
      .find({
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
        $or: [
          { usageLimit: null },
          { usageLimit: { $gt: 0 } },
          { usedCount: { $lt: { $ifNull: ["$usageLimit", Infinity] } } },
        ],
      })
      .populate("applicableProducts", "name price photo")
      .populate("applicableCategories", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).send({
      success: true,
      countTotal: offers.length,
      message: "Active Offers",
      offers,
    });
  } catch (error) {
    console.error("Get Active Offers Error:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting active offers",
      error: error.message,
    });
  }
};

// Get single offer
export const getSingleOfferController = async (req, res) => {
  try {
    const offer = await offerModel
      .findOne({ slug: req.params.slug })
      .populate("applicableProducts", "name price category photo")
      .populate("applicableCategories", "name");

    if (!offer) {
      return res.status(404).send({
        success: false,
        message: "Offer not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Single Offer Fetched",
      offer,
    });
  } catch (error) {
    console.error("Get Single Offer Error:", error);
    res.status(500).send({
      success: false,
      message: "Error while getting single offer",
      error: error.message,
    });
  }
};

// Update offer
export const updateOfferController = async (req, res) => {
  try {
    const {
      name,
      description,
      discountType,
      discountValue,
      applicableProducts,
      applicableCategories,
      startDate,
      endDate,
      isActive,
      minPurchaseAmount,
      maxDiscountAmount,
      usageLimit,
    } = req.body;

    // Validation
    const errors = [];
    if (!name) errors.push("Name is Required");
    if (!description) errors.push("Description is Required");
    if (!discountType) errors.push("Discount Type is Required");
    if (!discountValue) errors.push("Discount Value is Required");
    if (!startDate) errors.push("Start Date is Required");
    if (!endDate) errors.push("End Date is Required");

    if (errors.length > 0) {
      return res.status(400).send({ error: errors.join(", ") });
    }

    // Validate discount value
    if (
      discountType === "percentage" &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      return res.status(400).send({
        error: "Percentage discount must be between 1 and 100",
      });
    }

    if (discountType === "fixed" && discountValue <= 0) {
      return res.status(400).send({
        error: "Fixed discount must be greater than 0",
      });
    }

    // First remove offer from all previously affected products
    const oldOffer = await offerModel.findById(req.params.oid);
    if (
      oldOffer &&
      oldOffer.applicableProducts &&
      oldOffer.applicableProducts.length > 0
    ) {
      await removeOfferFromProducts(oldOffer._id, oldOffer.applicableProducts);
    }

    const updateData = {
      name,
      description,
      discountType,
      discountValue,
      applicableProducts: applicableProducts || [],
      applicableCategories: applicableCategories || [],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive,
      minPurchaseAmount: minPurchaseAmount || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      usageLimit: usageLimit || null,
      slug: slugify(name),
    };

    const offer = await offerModel.findByIdAndUpdate(
      req.params.oid,
      updateData,
      { new: true, runValidators: true }
    );

    if (!offer) {
      return res.status(404).send({
        success: false,
        message: "Offer not found",
      });
    }

    // Apply offer to new products if applicable
    if (applicableProducts && applicableProducts.length > 0) {
      await applyOfferToProducts(
        offer._id,
        applicableProducts,
        discountType,
        discountValue,
        endDate
      );
    }

    res.status(200).send({
      success: true,
      message: "Offer Updated Successfully",
      offer,
    });
  } catch (error) {
    console.error("Update Offer Error:", error);
    res.status(500).send({
      success: false,
      error: error.message,
      message: "Error in updating offer",
    });
  }
};

// Delete offer
export const deleteOfferController = async (req, res) => {
  try {
    const offer = await offerModel.findById(req.params.oid);

    if (!offer) {
      return res.status(404).send({
        success: false,
        message: "Offer not found",
      });
    }

    // Remove offer from all affected products before deleting
    if (offer.applicableProducts && offer.applicableProducts.length > 0) {
      await removeOfferFromProducts(offer._id, offer.applicableProducts);
    }

    await offerModel.findByIdAndDelete(req.params.oid);

    res.status(200).send({
      success: true,
      message: "Offer Deleted successfully",
    });
  } catch (error) {
    console.error("Delete Offer Error:", error);
    res.status(500).send({
      success: false,
      message: "Error while deleting offer",
      error: error.message,
    });
  }
};

// Apply offer to specific products
export const applyOfferToProductsController = async (req, res) => {
  try {
    const { offerId, productIds } = req.body;

    if (!offerId || !productIds || !Array.isArray(productIds)) {
      return res.status(400).send({
        success: false,
        message: "Offer ID and product IDs array are required",
      });
    }

    const offer = await offerModel.findById(offerId);
    if (!offer) {
      return res.status(404).send({
        success: false,
        message: "Offer not found",
      });
    }

    await applyOfferToProducts(
      offerId,
      productIds,
      offer.discountType,
      offer.discountValue,
      offer.endDate
    );

    // Update offer with new applicable products
    const updatedOffer = await offerModel
      .findByIdAndUpdate(
        offerId,
        {
          $addToSet: { applicableProducts: { $each: productIds } },
        },
        { new: true }
      )
      .populate("applicableProducts", "name price");

    res.status(200).send({
      success: true,
      message: "Offer applied to products successfully",
      offer: updatedOffer,
    });
  } catch (error) {
    console.error("Apply Offer to Products Error:", error);
    res.status(500).send({
      success: false,
      message: "Error while applying offer to products",
      error: error.message,
    });
  }
};

// Remove offer from specific products
export const removeOfferFromProductsController = async (req, res) => {
  try {
    const { offerId, productIds } = req.body;

    if (!offerId || !productIds || !Array.isArray(productIds)) {
      return res.status(400).send({
        success: false,
        message: "Offer ID and product IDs array are required",
      });
    }

    await removeOfferFromProducts(offerId, productIds);

    // Update offer to remove products from applicableProducts
    const updatedOffer = await offerModel
      .findByIdAndUpdate(
        offerId,
        {
          $pull: { applicableProducts: { $in: productIds } },
        },
        { new: true }
      )
      .populate("applicableProducts", "name price");

    res.status(200).send({
      success: true,
      message: "Offer removed from products successfully",
      offer: updatedOffer,
    });
  } catch (error) {
    console.error("Remove Offer from Products Error:", error);
    res.status(500).send({
      success: false,
      message: "Error while removing offer from products",
      error: error.message,
    });
  }
};

// Get products by offer
export const getProductsByOfferController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const products = await productModel
      .find({ "discount.offer": req.params.oid })
      .select("-photo")
      .populate("category", "name")
      .populate("discount.offer", "name discountType discountValue")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await productModel.countDocuments({
      "discount.offer": req.params.oid,
    });

    // Add discounted price information
    const productsWithDiscount = products.map((product) => {
      const productObj = product.toObject();
      productObj.discountedPrice = product.discountedPrice;
      productObj.hasActiveDiscount = product.hasActiveDiscount;
      return productObj;
    });

    res.status(200).send({
      success: true,
      countTotal: products.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      message: "Products with this offer",
      products: productsWithDiscount,
    });
  } catch (error) {
    console.error("Get Products by Offer Error:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting products by offer",
      error: error.message,
    });
  }
};

// Check offer validity
export const checkOfferValidityController = async (req, res) => {
  try {
    const offer = await offerModel.findById(req.params.oid);

    if (!offer) {
      return res.status(404).send({
        success: false,
        message: "Offer not found",
      });
    }

    const isValid = offer.isValid;

    res.status(200).send({
      success: true,
      isValid,
      message: isValid ? "Offer is valid" : "Offer is not valid",
      offer: {
        _id: offer._id,
        name: offer.name,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        startDate: offer.startDate,
        endDate: offer.endDate,
        isActive: offer.isActive,
      },
    });
  } catch (error) {
    console.error("Check Offer Validity Error:", error);
    res.status(500).send({
      success: false,
      message: "Error in checking offer validity",
      error: error.message,
    });
  }
};

// Get offers by status
export const getOffersByStatusController = async (req, res) => {
  try {
    const { status } = req.params;
    const currentDate = new Date();
    let query = {};

    switch (status) {
      case "active":
        query = {
          isActive: true,
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate },
        };
        break;
      case "upcoming":
        query = {
          isActive: true,
          startDate: { $gt: currentDate },
        };
        break;
      case "expired":
        query = {
          endDate: { $lt: currentDate },
        };
        break;
      case "inactive":
        query = { isActive: false };
        break;
      default:
        return res.status(400).send({
          success: false,
          message: "Invalid status parameter",
        });
    }

    const offers = await offerModel
      .find(query)
      .populate("applicableProducts", "name price")
      .populate("applicableCategories", "name")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      countTotal: offers.length,
      message: `${status.charAt(0).toUpperCase() + status.slice(1)} Offers`,
      offers,
    });
  } catch (error) {
    console.error("Get Offers by Status Error:", error);
    res.status(500).send({
      success: false,
      message: "Error in getting offers by status",
      error: error.message,
    });
  }
};

// Helper function to apply offer to products
const applyOfferToProducts = async (
  offerId,
  productIds,
  discountType,
  discountValue,
  endDate
) => {
  const updateOperations = productIds.map((productId) => ({
    updateOne: {
      filter: { _id: productId },
      update: {
        discount: {
          type: discountType,
          value: discountValue,
          offer: offerId,
          appliedAt: new Date(),
        },
        onSale: true,
        saleEndDate: new Date(endDate),
        // Preserve original price if not set
        $setOnInsert: { originalPrice: "$price" },
      },
    },
  }));

  await productModel.bulkWrite(updateOperations);
};

// Helper function to remove offer from products
const removeOfferFromProducts = async (offerId, productIds) => {
  const updateOperations = productIds.map((productId) => ({
    updateOne: {
      filter: { _id: productId, "discount.offer": offerId },
      update: {
        $unset: { discount: "" },
        onSale: false,
        saleEndDate: null,
        // Reset price to original price if it exists
        $set: {
          price: { $ifNull: ["$originalPrice", "$price"] },
        },
      },
    },
  }));

  await productModel.bulkWrite(updateOperations);
};
