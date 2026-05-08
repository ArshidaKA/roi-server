// src/routes/staff.js
import express from "express";
import { getStaff, createStaff, updateStaff, deleteStaff } from "../controllers/staffController.js";
import { getAllAdvances, getAdvanceByStaff, addAdvanceTransaction, deleteAdvanceTransaction } from "../controllers/advanceController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

// ── Advance routes MUST come before /:id ──────────────────────
// Otherwise Express matches "advances" as the :id param
router.get("/advances",                                getAllAdvances);
router.get("/advances/:staffId",                       getAdvanceByStaff);
router.post("/advances/:staffId",                      addAdvanceTransaction);
router.delete("/advances/:staffId/transaction/:txId",  deleteAdvanceTransaction);

// ── Staff CRUD ────────────────────────────────────────────────
router.route("/").get(getStaff).post(createStaff);
router.route("/:id").put(updateStaff).delete(deleteStaff);
// ONE-TIME FIX ROUTE — delete after running once
// router.get("/fix-null-staffid", async (req, res) => {
//   try {
//     const { StaffAdvance } = await import("../models/StaffAdvance.js");
//     const Staff = (await import("../models/staff.js")).default;

//     // Find the orphaned record
//     const orphan = await StaffAdvance.findOne({ staffId: null });
//     if (!orphan) return res.json({ message: "No orphaned record found — already fixed!" });

//     // List all staff so you can identify which one this belongs to
//     const allStaff = await Staff.find({ isActive: true });

//     res.json({
//       message: "Orphaned advance record found",
//       orphanId: orphan._id,
//       transactionCount: orphan.transactions.length,
//       totalSettled: orphan.transactions
//         .filter(t => t.type === "settled")
//         .reduce((s, t) => s + t.amount, 0),
//       allStaff: allStaff.map(s => ({ id: s._id, name: s.name, salary: s.salary })),
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// STEP 2 — run this with the correct staffId once you know it
router.get("/fix-null-staffid/:correctStaffId", async (req, res) => {
  try {
    const { StaffAdvance } = await import("../models/StaffAdvance.js");

    const result = await StaffAdvance.updateOne(
      { staffId: null },
      { $set: { staffId: req.params.correctStaffId } }
    );

    res.json({ message: "Fixed!", result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;