// src/controllers/attendanceController.js
import Attendance from "../models/Attendance.js";
import ROIEntry from "../models/ROIEntry.js";
import Staff from "../models/Staff.js";

export async function markAttendance(req, res) {
  try {
    const { staffId, date, status } = req.body;

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    let calculatedSalary = 0;
    const daily = staff.dailySalary || staff.salary / 30;
    if (status === "present")  calculatedSalary = daily;
    else if (status === "half-day") calculatedSalary = daily / 2;

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendance.findOne({ staffId, date: dateObj });

    let attendance;
    if (existingAttendance) {
      attendance = await Attendance.findByIdAndUpdate(
        existingAttendance._id,
        { status, calculatedSalary },
        { new: true }
      ).populate("staffId", "name role");
    } else {
      attendance = new Attendance({ staffId, date: dateObj, status, calculatedSalary, createdBy: req.user.id });
      await attendance.save();
      attendance = await attendance.populate("staffId", "name role");
    }

    res.status(201).json(attendance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function getAttendance(req, res) {
  try {
    const { date, staffId } = req.query;
    let query = {};
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const d2 = new Date(d);
      d2.setDate(d2.getDate() + 1);
      query.date = { $gte: d, $lt: d2 };
    }
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

    const daily = attendance.staffId.dailySalary || attendance.staffId.salary / 30;
    let calculatedSalary = 0;
    if (status === "present")  calculatedSalary = daily;
    else if (status === "half-day") calculatedSalary = daily / 2;

    const updated = await Attendance.findByIdAndUpdate(
      id, { status, calculatedSalary }, { new: true }
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
    const endDate   = new Date(year, month, 0, 23, 59, 59);

    const attendance = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    }).populate("staffId", "name role salary dailySalary");

    res.json(attendance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// GET /attendance/salary-summary?date=YYYY-MM-DD   → single day totals
// GET /attendance/salary-summary?month=YYYY-MM     → month totals + perStaff earned
export async function getSalarySummary(req, res) {
  try {
    const { date, month } = req.query;

    if (date) {
      // ── Single day ──────────────────────────────────────
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const d2 = new Date(d);
      d2.setDate(d2.getDate() + 1);

      const records = await Attendance.find({ date: { $gte: d, $lt: d2 } })
        .populate("staffId", "name role salary accommodation");

      let totalSalary = 0;
      let totalAccommodation = 0;
      records.forEach(r => {
        totalSalary        += r.calculatedSalary || 0;
        totalAccommodation += r.staffId?.accommodation || 0;
      });

      return res.json({ date: d, totalSalary, totalAccommodation, count: records.length });
    }

    if (month) {
      // ── Monthly ─────────────────────────────────────────
      const [yr, mo] = month.split("-").map(Number);
      const startDate = new Date(yr, mo - 1, 1);
      const endDate   = new Date(yr, mo, 0, 23, 59, 59);

      const records = await Attendance.find({ date: { $gte: startDate, $lte: endDate } })
        .populate("staffId", "name role salary accommodation");

      let totalSalary = 0;
      let totalAccommodation = 0;
      const perStaff = {};

      records.forEach(r => {
        totalSalary        += r.calculatedSalary || 0;
        totalAccommodation += r.staffId?.accommodation || 0;
        const sid = r.staffId?._id?.toString();
        if (sid) {
          if (!perStaff[sid]) perStaff[sid] = { earned: 0, days: 0 };
          perStaff[sid].earned += r.calculatedSalary || 0;
          perStaff[sid].days   += r.status === "half-day" ? 0.5 : r.status === "present" ? 1 : 0;
        }
      });

      return res.json({ month, totalSalary, totalAccommodation, perStaff });
    }

    res.status(400).json({ message: "Provide date or month query param" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}