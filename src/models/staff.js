// src/models/Staff.js
import mongoose from "mongoose";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  salary: { type: Number, required: true }, // Monthly salary
  dailySalary: { type: Number }, // Will be calculated
  accommodation: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

// Calculate daily salary before saving
staffSchema.pre("save", function (next) {
  if (this.isModified("salary")) {
    // Assuming 30 working days
    this.dailySalary = this.salary / 30;
  }
  next();
});

// ✅ Fix OverwriteModelError by reusing existing model if already compiled
export default mongoose.models.Staff || mongoose.model("Staff", staffSchema);
