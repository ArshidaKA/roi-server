import Attendance from "../models/Attendance.js";
import ROIEntry from "../models/ROIEntry.js";
import Staff from "../models/Staff.js";

// 👈 add this

export async function markAttendance(req, res) {
  try {
    const { staffId, date, status } = req.body;
    
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    let calculatedSalary = 0;
    if (status === "present") calculatedSalary = staff.dailySalary || staff.salary / 26;
    else if (status === "half-day") calculatedSalary = (staff.dailySalary || staff.salary / 26) / 2;
    else if (status === "leave" || status === "absent") calculatedSalary = 0;

    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      staffId,
      date: new Date(date)
    });

    let attendance;
    if (existingAttendance) {
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        { status, calculatedSalary },
        { new: true }
      ).populate("staffId", "name role");
    } else {
      attendance = await Attendance.create({
        staffId,
        date: new Date(date),
        status,
        calculatedSalary,
        createdBy: req.user.id
      }).populate("staffId", "name role");
    }

    // ✅ Update ROI Entry for that day
    await ROIEntry.findOneAndUpdate(
      { date: new Date(date) },
      {
        $inc: { "expenses.staffSalary.0.amount": calculatedSalary }, // push into expenses
        $setOnInsert: {
          date: new Date(date),
          totalRevenue: 0,
          purchaseCost: [],
          expenses: {
            food: 0,
            rent: 0,
            electricity: 0,
            staffSalary: [{ name: "Staff Salary", amount: 0 }],
            staffAccommodation: [{ name: "Staff Accommodation", amount: 0 }],
          },
          createdBy: req.user.id,
        },
      },
      { new: true, upsert: true }
    );

    res.status(201).json(attendance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}


export async function getAttendance(req, res) {
  try {
    const { date, staffId } = req.query;
    let query = {};

    if (date) query.date = new Date(date);
    if (staffId) query.staffId = staffId;

    const attendance = await Attendance.find(query)
      .populate("staffId", "name role")
      .sort({ date: -1 });

    res.json(attendance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateAttendance(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const attendance = await Attendance.findById(id).populate("staffId");
    if (!attendance) return res.status(404).json({ message: "Attendance not found" });

    let calculatedSalary = 0;
    if (status === "present") calculatedSalary = attendance.staffId.dailySalary || attendance.staffId.salary / 26;
    else if (status === "half-day") calculatedSalary = (attendance.staffId.dailySalary || attendance.staffId.salary / 26) / 2;
    else if (status === "leave") calculatedSalary = 0;
    else if (status === "absent") calculatedSalary = 0;

    const updated = await Attendance.findByIdAndUpdate(
      id,
      { status, calculatedSalary },
      { new: true }
    ).populate("staffId", "name role");

    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function getMonthlyAttendance(req, res) {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate("staffId", "name role salary dailySalary");

    res.json(attendance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
export async function getSalarySummary(req, res) {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "Date is required" });

    const targetDate = new Date(date);

    // Find all attendance records for that date
    const attendanceRecords = await Attendance.find({ date: targetDate })
      .populate("staffId", "name role salary accommodation");

    // Calculate totals
    let totalSalary = 0;
    let totalAccommodation = 0;

    attendanceRecords.forEach((record) => {
      totalSalary += record.calculatedSalary || 0;
      totalAccommodation += record.staffId.accommodation || 0;
    });

    res.json({
      date: targetDate,
      totalSalary,
      totalAccommodation,
      count: attendanceRecords.length,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
