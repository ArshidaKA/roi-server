// src/models/StaffAdvance.js
import mongoose from "mongoose";

const advanceTxSchema = new mongoose.Schema({
  type:    { type: String, enum: ["credit", "settled"], required: true },
  amount:  { type: Number, required: true, min: 0 },
  note:    { type: String, default: "" },
  date:    { type: Date,   default: Date.now },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true, _id: true });

const staffAdvanceSchema = new mongoose.Schema({
  staffId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  transactions: { type: [advanceTxSchema], default: [] },
}, { timestamps: true });

staffAdvanceSchema.virtual("totalCredit").get(function () {
  return this.transactions
    .filter(t => t.type === "credit")
    .reduce((s, t) => s + (t.amount || 0), 0);
});

staffAdvanceSchema.virtual("totalSettled").get(function () {
  return this.transactions
    .filter(t => t.type === "settled")
    .reduce((s, t) => s + (t.amount || 0), 0);
});

staffAdvanceSchema.virtual("outstanding").get(function () {
  return this.totalCredit - this.totalSettled;
});

staffAdvanceSchema.set("toJSON",   { virtuals: true });
staffAdvanceSchema.set("toObject", { virtuals: true });

export const StaffAdvance = mongoose.models.StaffAdvance
  || mongoose.model("StaffAdvance", staffAdvanceSchema);