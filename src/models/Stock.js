// src/models/Stock.js
import mongoose from "mongoose";

const stockItemSchema = new mongoose.Schema({
  item:   { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
  unit:   { type: String, default: "" }, // optional: kg, litre, pcs, etc.
}, { _id: true });

const stockSchema = new mongoose.Schema({
  date:         { type: Date,   required: true },
  type:         { type: String, enum: ["opening", "closing"], required: true },
  items:        { type: [stockItemSchema], default: [] },
  totalValue:   { type: Number, default: 0 },   // sum of all item amounts
  notes:        { type: String, default: "" },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

// Auto-calc totalValue before save
stockSchema.pre("save", function (next) {
  this.totalValue = this.items.reduce((s, i) => s + (i.amount || 0), 0);
  next();
});

// Prevent duplicate opening/closing for same date
stockSchema.index({ date: 1, type: 1 }, { unique: true });

export default mongoose.models.Stock || mongoose.model("Stock", stockSchema);