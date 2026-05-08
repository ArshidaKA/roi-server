// src/models/ROIEntry.js
// Updated schema: every expense item now carries isCredit / creditSettled / creditOutstanding.
// Top-level totalExpCreditOutstanding, totalExpCreditRaised, totalExpSettled for fast dashboard queries.

import mongoose from "mongoose";
const { Schema, model } = mongoose;

// ── Credit fields mixin (added to every expense sub-schema) ──
const creditFields = {
  isCredit:         { type: Boolean, default: false },
  creditSettled:    { type: Number,  default: 0 },
  creditOutstanding:{ type: Number,  default: 0 },
};

// ── Sub-schemas ───────────────────────────────────────────────
const subItemSchema = new Schema(
  { item: String, amount: Number, source: { type: String, default: "" }, ...creditFields },
  { _id: false }
);

const otherExpenseSchema = new Schema(
  { reason: String, amount: Number, source: String, ...creditFields },
  { _id: false }
);

const marketingItemSchema = new Schema(
  { remark: String, amount: Number, source: String, ...creditFields },
  { _id: false }
);

const foodWastageItemSchema = new Schema(
  { item: String, amount: Number, source: String, ...creditFields },
  { _id: false }
);

const singleExpSchema = new Schema(
  { amount: { type: Number, default: 0 }, source: { type: String, default: "" }, ...creditFields },
  { _id: false }
);

const royaltyFeeSchema = new Schema(
  { label: { type: String, default: "Royalty / Mgt. Fee" }, amount: { type: Number, default: 0 }, source: { type: String, default: "" }, ...creditFields },
  { _id: false }
);

// ── Expense schema ─────────────────────────────────────────────
const expenseSchema = new Schema({
  staffSalary:        [subItemSchema],
  staffAccommodation: [subItemSchema],
  commissionOnSales:  { type: singleExpSchema, default: () => ({}) },
  royaltyFees:        { type: [royaltyFeeSchema],      default: [] },
  gasStaff:           { type: singleExpSchema, default: () => ({}) },
  gasStore:           { type: singleExpSchema, default: () => ({}) },
  foodRefreshment:    { type: singleExpSchema, default: () => ({}) },
  rent:               { type: singleExpSchema, default: () => ({}) },
  electricity:        { type: singleExpSchema, default: () => ({}) },
  travelFuel:         { type: singleExpSchema, default: () => ({}) },
  mobileInternet:     { type: singleExpSchema, default: () => ({}) },
  maintenance:        { type: singleExpSchema, default: () => ({}) },
  incentive:          { type: singleExpSchema, default: () => ({}) },
  marketing:          { type: [marketingItemSchema],   default: [] },
  foodWastageCooked:  { type: [foodWastageItemSchema], default: [] },
  foodWastageRaw:     { type: [foodWastageItemSchema], default: [] },
  other:              { type: [otherExpenseSchema],    default: [] },
}, { _id: false });

// ── Revenue split ──────────────────────────────────────────────
const revenueSplitSchema = new Schema({
  cash:        { type: Number, default: 0 },
  federalBank: { type: Number, default: 0 },
  vibgyorBank: { type: Number, default: 0 },
  asifAccount: { type: Number, default: 0 },
}, { _id: false });

// ── ROI Entry ──────────────────────────────────────────────────
const roiEntrySchema = new Schema({
  date:         { type: Date,   required: true },
  totalRevenue: { type: Number, required: true },
  revenueSplit: { type: revenueSplitSchema, default: () => ({}) },

  // purchaseCost rows also carry credit fields
  purchaseCost: { type: [subItemSchema], default: [] },

  expenses: { type: expenseSchema },

  // ── Expense credit totals (pre-computed on save for fast dashboard queries) ──
  totalExpCreditRaised:      { type: Number, default: 0 },
  totalExpSettled:           { type: Number, default: 0 },
  totalExpCreditOutstanding: { type: Number, default: 0 },

  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default model("ROIEntry", roiEntrySchema);