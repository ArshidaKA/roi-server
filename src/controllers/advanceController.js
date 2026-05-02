// src/controllers/advanceController.js
import { StaffAdvance } from "../models/StaffAdvance.js";
import Staff from "../models/taff.js";

// GET /staff/advances — all staff advances with staffName populated
export async function getAllAdvances(req, res) {
  try {
    const advances = await StaffAdvance.find().populate("staffId", "name role");
    const result = advances.map(a => {
      const obj = a.toObject();
      obj.staffName = a.staffId?.name || "";
      return obj;
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// GET /staff/advances/:staffId — single staff advance record
export async function getAdvanceByStaff(req, res) {
  try {
    const advance = await StaffAdvance.findOne({ staffId: req.params.staffId })
      .populate("staffId", "name role");
    if (!advance) return res.json({ staffId: req.params.staffId, transactions: [], totalCredit: 0, totalSettled: 0, outstanding: 0 });
    res.json(advance.toObject());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// POST /staff/advances/:staffId — add credit or settled transaction
export async function addAdvanceTransaction(req, res) {
  try {
    const { type, amount, note } = req.body;
    if (!["credit", "settled"].includes(type)) return res.status(400).json({ message: "type must be credit or settled" });
    if (!amount || amount <= 0) return res.status(400).json({ message: "amount must be > 0" });

    let advance = await StaffAdvance.findOne({ staffId: req.params.staffId });
    if (!advance) {
      advance = await StaffAdvance.create({ staffId: req.params.staffId, transactions: [] });
    }

    advance.transactions.push({ type, amount: Number(amount), note: note || "", addedBy: req.user.id, date: new Date() });
    await advance.save();

    const obj = advance.toObject();
    res.status(201).json(obj);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// DELETE /staff/advances/:staffId/transaction/:txId
export async function deleteAdvanceTransaction(req, res) {
  try {
    const advance = await StaffAdvance.findOne({ staffId: req.params.staffId });
    if (!advance) return res.status(404).json({ message: "Not found" });
    advance.transactions = advance.transactions.filter(t => t._id.toString() !== req.params.txId);
    await advance.save();
    res.json(advance.toObject());
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}