// models/ReturnRequest.js
import mongoose from "mongoose";

const ReturnRequestSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, required: true }, // original order
    buyer: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "users" },
    reason: { type: String, required: true, maxlength: 1000 },
    desiredResolution: { type: String, enum: ["refund", "replacement"], required: true },

    status: { type: String, enum: ["pending", "accepted", "rejected", "completed"], default: "pending" },
    adminResolution: { type: String, enum: ["refund", "replacement", null], default: null },
    adminNote: { type: String, default: "" },
    processedAt: { type: Date },
    completedAt: { type: Date },

    // Replacement order link (if created)
    replacementOrder: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

// Same (order+buyer) এ একাধিক open (pending/accepted) রিকোয়েস্ট ব্লক
ReturnRequestSchema.index(
  { order: 1, buyer: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["pending", "accepted"] } } }
);

export default mongoose.model("ReturnRequest", ReturnRequestSchema);
