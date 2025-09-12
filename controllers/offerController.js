// controllers/offerController.js
import offerModel from "../models/offerModel.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import fs from "fs";
import slugify from "slugify";

// Create offer
export const createOfferController = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      products,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive,
    } = req.fields;

    const { bannerImage } = req.files;

    // Validation
    switch (true) {
      case !title:
        return res.status(500).send({ error: "Title is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !discountType:
        return res.status(500).send({ error: "Discount Type is Required" });
      case !discountValue:
        return res.status(500).send({ error: "Discount Value is Required" });
      case !startDate:
        return res.status(500).send({ error: "Start Date is Required" });
      case !endDate:
        return res.status(500).send({ error: "End Date is Required" });
      case bannerImage && bannerImage.size > 1000000:
        return res
          .status(500)
          .send({ error: "Banner image should be less than 1MB" });
    }

    const offer = new offerModel({
      ...req.fields,
      createdBy: req.user._id,
    });

    if (bannerImage) {
      offer.bannerImage.data = fs.readFileSync(bannerImage.path);
      offer.bannerImage.contentType = bannerImage.type;
    }

    await offer.save();
    res.status(201).send({
      success: true,
      message: "Offer Created Successfully",
      offer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in creating offer",
    });
  }
};

// Get all offers
// In offerController.js - Fix getAllOffersController
export const getAllOffersController = async (req, res) => {
  try {
  
    

    const offers = await offerModel
      .find({})
      .populate({
        path: "category",
        select: "name slug",
        model: "Category", // Explicitly specify model
      })
      .populate({
        path: "products",
        select: "name price",
        model: "Products", // Explicitly specify model
      })
      .populate({
        path: "createdBy",
        select: "name email",
        model: "users", // Note: your user model might be "users" based on orderModel
      })
      .select("-bannerImage")
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    console.log("Successfully retrieved offers:", offers.length);

    res.status(200).send({
      success: true,
      message: "All Offers Retrieved Successfully",
      offers,
      count: offers.length,
    });
  } catch (error) {
    console.error("=== ERROR IN GET OFFERS ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // Check if it's a population error
    if (error.name === "CastError") {
      console.error("CastError - likely invalid reference ID in database");
    }

    res.status(500).send({
      success: false,
      message: "Error in getting offers",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get active offers for carousel
export const getActiveOffersController = async (req, res) => {
  try {
    const currentDate = new Date();

    const offers = await offerModel
      .find({
        isActive: true,
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
      })
      .populate("category")
      .populate("products")
      .select("-bannerImage")
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      message: "Active Offers",
      offers,
    });
  } catch (error) {
    console.log(error);
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
      .findById(req.params.oid)
      .populate("category")
      .populate("products")
      .populate("createdBy", "name");

    if (offer.bannerImage.data) {
      res.set("Content-type", offer.bannerImage.contentType);
      return res.status(200).send(offer.bannerImage.data);
    }

    res.status(200).send({
      success: true,
      message: "Single Offer Fetched",
      offer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting single offer",
      error,
    });
  }
};

// Update offer
export const updateOfferController = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      products,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive,
    } = req.fields;

    const { bannerImage } = req.files;

    // Validation
    switch (true) {
      case !title:
        return res.status(500).send({ error: "Title is Required" });
      case !description:
        return res.status(500).send({ error: "Description is Required" });
      case !category:
        return res.status(500).send({ error: "Category is Required" });
      case !discountType:
        return res.status(500).send({ error: "Discount Type is Required" });
      case !discountValue:
        return res.status(500).send({ error: "Discount Value is Required" });
      case !startDate:
        return res.status(500).send({ error: "Start Date is Required" });
      case !endDate:
        return res.status(500).send({ error: "End Date is Required" });
      case bannerImage && bannerImage.size > 1000000:
        return res
          .status(500)
          .send({ error: "Banner image should be less than 1MB" });
    }

    const offer = await offerModel.findByIdAndUpdate(
      req.params.oid,
      { ...req.fields },
      { new: true }
    );

    if (bannerImage) {
      offer.bannerImage.data = fs.readFileSync(bannerImage.path);
      offer.bannerImage.contentType = bannerImage.type;
    }

    await offer.save();
    res.status(200).send({
      success: true,
      message: "Offer Updated Successfully",
      offer,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in updating offer",
    });
  }
};

// Delete offer
export const deleteOfferController = async (req, res) => {
  try {
    await offerModel.findByIdAndDelete(req.params.oid);
    res.status(200).send({
      success: true,
      message: "Offer Deleted successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting offer",
      error,
    });
  }
};

// Get offer banner image
export const offerBannerController = async (req, res) => {
  try {
    const offer = await offerModel
      .findById(req.params.oid)
      .select("bannerImage");
    if (offer.bannerImage.data) {
      res.set("Content-type", offer.bannerImage.contentType);
      return res.status(200).send(offer.bannerImage.data);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while getting banner image",
      error,
    });
  }
};

// In offerController.js - Fix the getProductsByCategoryController
export const getProductsByCategoryController = async (req, res) => {
  try {
    const { cid } = req.params;
    
    console.log("Fetching products for category ID:", cid); // Debug log
    
    // Find products by category ID and populate category details
    const products = await productModel
      .find({ category: cid })
      .select("-photo")
      .populate("category", "name slug") // Populate category name and slug
      .sort({ createdAt: -1 });

    

    res.status(200).send({
      success: true,
      message: "Products fetched successfully",
      products,
      count: products.length,
    });
  } catch (error) {
    console.log("Error in getProductsByCategoryController:", error);
    res.status(500).send({
      success: false,
      message: "Error while getting products by category",
      error: error.message,
    });
  }
};
