import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ["percentage", "fixed"],
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    applicableProducts: [
      {
        type: mongoose.ObjectId,
        ref: "Products",
      },
    ],
    applicableCategories: [
      {
        type: mongoose.ObjectId,
        ref: "Category",
      },
    ],
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
    minPurchaseAmount: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for better performance
offerSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
offerSchema.index({ slug: 1 });

// Virtual to check if offer is currently valid
offerSchema.virtual("isValid").get(function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
});

// Method to check if offer can be applied to a product
offerSchema.methods.canApplyToProduct = function (productId) {
  if (!this.applicableProducts || this.applicableProducts.length === 0) {
    return true;
  }
  return this.applicableProducts.some(
    (product) => product.toString() === productId.toString()
  );
};

// Method to check if offer can be applied to a category
offerSchema.methods.canApplyToCategory = function (categoryId) {
  if (!this.applicableCategories || this.applicableCategories.length === 0) {
    return true;
  }
  return this.applicableCategories.some(
    (category) => category.toString() === categoryId.toString()
  );
};

// Method to calculate discount amount
offerSchema.methods.calculateDiscount = function (originalPrice) {
  let discountAmount = 0;

  if (this.discountType === "percentage") {
    discountAmount = (originalPrice * this.discountValue) / 100;
  } else if (this.discountType === "fixed") {
    discountAmount = this.discountValue;
  }

  // Apply max discount limit if set
  if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
    discountAmount = this.maxDiscountAmount;
  }

  return Math.max(0, Math.min(discountAmount, originalPrice));
};

// Pre-save middleware to generate slug
offerSchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }
  next();
});

export default mongoose.model("Offer", offerSchema);
