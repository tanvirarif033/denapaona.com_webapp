import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    // ... existing fields ...
    discount: {
      type: {
        type: String,
        enum: ["percentage", "fixed"],
        default: null,
      },
      value: {
        type: Number,
        default: 0,
      },
      offer: {
        type: mongoose.ObjectId,
        ref: "Offer",
        default: null,
      },
      appliedAt: {
        type: Date,
        default: null,
      },
    },
    onSale: {
      type: Boolean,
      default: false,
    },
    saleEndDate: {
      type: Date,
      default: null,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// ... existing virtuals and methods ...

// Add this method to check if discount is from an active offer
productSchema.methods.isDiscountFromActiveOffer = async function () {
  if (!this.discount.offer) {
    return false;
  }

  try {
    const Offer = mongoose.model("Offer");
    const offer = await Offer.findById(this.discount.offer);
    return offer && offer.isValid;
  } catch (error) {
    return false;
  }
};

// Add this method to refresh discount status
productSchema.methods.refreshDiscountStatus = async function () {
  const hasActiveDiscount = await this.isDiscountFromActiveOffer();

  if (this.onSale !== hasActiveDiscount) {
    this.onSale = hasActiveDiscount;
    await this.save();
  }

  return hasActiveDiscount;
};

export default mongoose.model("Products", productSchema);
