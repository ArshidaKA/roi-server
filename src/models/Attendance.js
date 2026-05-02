import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ["present", "half-day", "leave"], 
    default: "present" 
  },
  calculatedSalary: { type: Number }, // Salary for this day
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

// Prevent duplicate attendance entries for same staff on same day
attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);
