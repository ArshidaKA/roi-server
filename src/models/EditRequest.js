// models/EditRequest.js
import mongoose from "mongoose";

const editRequestSchema = new mongoose.Schema(
  {
    entryId: { type: mongoose.Schema.Types.ObjectId, ref: "ROIEntry", required: true },
    fieldPath: { type: String, required: true }, // e.g. "expenses.rent" or "purchaseCost[0].amount"
    newValue: mongoose.Schema.Types.Mixed,
    reason: { type: String, required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // NEW: when a STAFF uses an approved permission to perform the edit,
    // we mark that approval as consumed so it can't be reused.
    consumed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("EditRequest", editRequestSchema);
