// ─── src/models/StaffAdvance.js ──────────────────────────────────────────────
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
  return this.transactions.filter(t => t.type === "credit").reduce((s, t) => s + (t.amount || 0), 0);
});
staffAdvanceSchema.virtual("totalSettled").get(function () {
  return this.transactions.filter(t => t.type === "settled").reduce((s, t) => s + (t.amount || 0), 0);
});
staffAdvanceSchema.virtual("outstanding").get(function () {
  return this.totalCredit - this.totalSettled;
});
staffAdvanceSchema.set("toJSON",   { virtuals: true });
staffAdvanceSchema.set("toObject", { virtuals: true });

export const StaffAdvance = mongoose.model("StaffAdvance", staffAdvanceSchema);


// ─── src/models/ROIEntry.js ──────────────────────────────────────────────────
// Full updated ROI schema matching the new AddEntry structure (source per expense,
// credit/settled/settlements on each day's entry).

const { Schema, model } = mongoose;

const subItemSchema        = new Schema({ item: String, amount: Number }, { _id: false });
const otherExpenseSchema   = new Schema({ reason: String, amount: Number, source: String }, { _id: false });
const marketingItemSchema  = new Schema({ remark: String, amount: Number, source: String }, { _id: false });
const foodWastageItemSchema = new Schema({ item: String, amount: Number, source: String }, { _id: false });

// Single numeric expense that also records which account it came from
const singleExpSchema = new Schema({
  amount: { type: Number, default: 0 },
  source: { type: String, default: "" },
}, { _id: false });

const royaltyFeeSchema = new Schema({
  label:  { type: String, default: "Royalty / Mgt. Fee" },
  amount: { type: Number, default: 0 },
  source: { type: String, default: "" },
}, { _id: false });

const expenseSchema = new Schema({
  staffSalary:        [subItemSchema],
  staffAccommodation: [subItemSchema],
  commissionOnSales:  { type: singleExpSchema, default: () => ({}) },
  royaltyFees:        { type: [royaltyFeeSchema],     default: [] },
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

// Revenue split — four accounts
const revenueSplitSchema = new Schema({
  cash:        { type: Number, default: 0 },
  federalBank: { type: Number, default: 0 },
  vibgyorBank: { type: Number, default: 0 },
  asifAccount: { type: Number, default: 0 },
}, { _id: false });

// Individual settlement log entry
const settlementSchema = new Schema({
  amount:  { type: Number, required: true },
  account: { type: String, default: "" },
  date:    { type: Date,   default: Date.now },
  note:    { type: String, default: "" },
}, { _id: true, timestamps: true });

const roiEntrySchema = new Schema({
  date:         { type: Date,   required: true },
  totalRevenue: { type: Number, required: true },
  revenueSplit: { type: revenueSplitSchema, default: () => ({}) },
  purchaseCost: { type: [subItemSchema], default: [] },
  expenses:     { type: expenseSchema },

  // ── Credit / Settlement ──────────────────────────────────────
  creditAmount:  { type: Number, default: 0 },  // revenue not yet collected on this day
  settledAmount: { type: Number, default: 0 },  // cumulative recovered amount
  settlements:   { type: [settlementSchema], default: [] },

  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default model("ROIEntry", roiEntrySchema);