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
          .send({ error: "photo is Required and should be less then 1mb" });
    }

    const offer = new offerModel({
      ...req.fields,
      createdBy: req.user._id,
    });

    if (bannerImage) {
      // Read the image file properly
      offer.bannerImage.data = fs.readFileSync(bannerImage.path);
      offer.bannerImage.contentType = bannerImage.type;
      console.log(
        `Banner image uploaded: ${bannerImage.name}, Type: ${bannerImage.type}, Size: ${bannerImage.size} bytes`
      );
    }

    await offer.save();

    // 🔗 Link this offer to the products
if (products && products.length > 0) {
  await productModel.updateMany(
    { _id: { $in: products } },
    { $addToSet: { offers: offer._id } } // add offer to product.offers
  );
  console.log(`Offer ${offer._id} linked to products:`, products);
}

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
    // console.log("=== DEBUG: ACTIVE OFFERS CHECK ===");
    // console.log("Current server date:", currentDate);
    // console.log("Current server date (ISO):", currentDate.toISOString());

    // Find all offers to debug
    const allOffers = await offerModel
      .find({ isActive: true })
      .select("title startDate endDate")
      .lean();

    const offers = await offerModel
      .find({
        isActive: true, // Only this filter
        startDate: { $lte: currentDate },
        endDate: { $gte: currentDate },
      })
      .populate({
        path: "category",
        select: "name slug",
        model: "Category",
      })
      .populate({
        path: "products",
        select: "name slug price",
        model: "Products",
      })
      .select("title bannerImage") // Include bannerImage for debugging
      .sort({ createdAt: -1 })
      .lean();
    // Debug: Check which offers have banner images
    console.log("=== BANNER IMAGE DEBUG ===");
    offers.forEach((offer, index) => {
      console.log(`Offer ${index + 1}: ${offer.title}`);
      console.log(`Has bannerImage: ${!!offer.bannerImage}`);
      if (offer.bannerImage) {
        console.log(`Has bannerImage.data: ${!!offer.bannerImage.data}`);
        console.log(`Content type: ${offer.bannerImage.contentType}`);
      }
    });

    // Remove bannerImage data before sending response to avoid large payloads
    const offersWithoutImages = offers.map((offer) => {
      const { bannerImage, ...rest } = offer;
      return rest;
    });
    //console.log("ALL active offers (ignoring dates):", offers.length);

    res.status(200).send({
      success: true,
      message: "All Active Offers",
      offers: offersWithoutImages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in getting offers",
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

    // Find the offer by ID
    const offer = await offerModel.findById(req.params.oid);
    if (!offer) {
      return res.status(404).send({
        success: false,
        message: "Offer not found",
      });
    }

    // Update fields
    offer.title = title;
    offer.description = description;
    offer.category = category;
    offer.products = products;
    offer.discountType = discountType;
    offer.discountValue = discountValue;
    offer.startDate = startDate;
    offer.endDate = endDate;
    offer.isActive = isActive;
    offer.slug = slugify(title);

    if (bannerImage) {
      // Read the image file properly
      offer.bannerImage = {
        data: fs.readFileSync(bannerImage.path),
        contentType: bannerImage.type,
      };
      
    }

    await offer.save();

    // After offer.save()
    if (products && products.length > 0) {
      // First remove this offer from all products
      await productModel.updateMany({}, { $pull: { offers: offer._id } });

      // Then add it only to selected products
      await productModel.updateMany(
        { _id: { $in: products } },
        { $addToSet: { offers: offer._id } }
      );
      console.log(
        `Offer ${offer._id} updated and linked to products:`,
        products
      );
    }

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

export const offerBannerController = async (req, res) => {
  try {
    const offer = await offerModel
      .findById(req.params.oid)
      .select("bannerImage");
    if (offer.bannerImage.data) {
      res.set("Content-type", offer.bannerImage.contentType);
      return res.status(200).send(offer.bannerImage.data);
    } else {
      return res.status(404).send({
        success: false,
        message: "Banner image not found",
      });
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