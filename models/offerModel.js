// models/offerModel.js
import mongoose from "mongoose";
import slugify from "slugify";

const offerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.ObjectId,
      ref: "Category",
      required: true,
    },
    products: [
      {
        type: mongoose.ObjectId,
        ref: "Products",
      },
    ],
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "bogo"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    bannerImage: {
      data: Buffer,
      contentType: String,
    },
    createdBy: {
      type: mongoose.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Generate slug before saving
offerSchema.pre("save", function (next) {
  if (this.isModified("title") || this.isNew) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Offer", offerSchema);
