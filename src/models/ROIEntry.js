  import mongoose from "mongoose";

  const subItemSchema = new mongoose.Schema({
    item: String,
    amount: Number
  }, { _id: false });
  
const otherExpenseSchema = new mongoose.Schema({
  reason: String,
  amount: Number
}, { _id: false });

  const expenseSchema = new mongoose.Schema({
    staffSalary: [subItemSchema],
    staffAccommodation: [subItemSchema],
    foodRefreshment: Number,
    rent: Number,
    electricity: Number,
    travelFuel: Number,
    mobileInternet: Number,
    maintenance: Number,
    transport: Number,
    marketing: Number,
    consulting: Number,
    software: Number,
    incentive: Number,
    stockClearance: Number,
    other: [otherExpenseSchema]
  }, { _id: false });

  const roiEntrySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    totalRevenue: { type: Number, required: true },
    purchaseCost: [subItemSchema],
    expenses: expenseSchema,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  }, { timestamps: true });

  export default mongoose.model("ROIEntry", roiEntrySchema);