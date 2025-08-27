import mongoose from "mongoose";

const editRequestSchema = new mongoose.Schema({
  entryId: { type: mongoose.Schema.Types.ObjectId, ref: "ROIEntry", required: true },
  fieldPath: { type: String, required: true }, // e.g. "expenses.staffSalary[0].amount"
  newValue: mongoose.Schema.Types.Mixed,
  reason: { type: String, required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("EditRequest", editRequestSchema);