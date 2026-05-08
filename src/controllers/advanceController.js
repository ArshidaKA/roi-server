// src/controllers/advanceController.js
import { StaffAdvance } from "../models/StaffAdvance.js";
import Staff from "../models/staff.js";

// GET /staff/advances — all staff with their advance records + staffName joined
// GET /staff/advances — fix null staffId records
export async function getAllAdvances(req, res) {
  try {
    const allStaff    = await Staff.find({ isActive: true });
    const allAdvances = await StaffAdvance.find().lean();

    // Build map: staffId string → advance doc
    // IMPORTANT: skip records where staffId is null
    const advMap = {};
    allAdvances.forEach(a => {
      if (a.staffId) {                          // ← guard against null
        advMap[a.staffId.toString()] = a;
      }
    });

    const result = allStaff.map(s => {
      const sid = s._id.toString();
      const adv = advMap[sid];

      if (!adv) {
        return {
          staffId: sid, staffName: s.name,
          transactions: [], totalCredit: 0, totalSettled: 0, outstanding: 0,
        };
      }

      const totalCredit  = adv.transactions.filter(t => t.type === "credit")
                             .reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalSettled = adv.transactions.filter(t => t.type === "settled")
                             .reduce((sum, t) => sum + (t.amount || 0), 0);

      return {
        ...adv,
        staffId:   sid,
        staffName: s.name,
        totalCredit,
        totalSettled,
        outstanding: totalCredit - totalSettled,
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// GET /staff/advances/:staffId
export async function getAdvanceByStaff(req, res) {
  try {
    const { staffId } = req.params;
    let adv = await StaffAdvance.findOne({ staffId }).lean();

    if (!adv) {
      return res.json({ staffId, transactions: [], totalCredit: 0, totalSettled: 0, outstanding: 0 });
    }

    const totalCredit  = adv.transactions.filter(t => t.type === "credit") .reduce((s, t) => s + (t.amount || 0), 0);
    const totalSettled = adv.transactions.filter(t => t.type === "settled").reduce((s, t) => s + (t.amount || 0), 0);

    res.json({ ...adv, staffId: staffId.toString(), totalCredit, totalSettled, outstanding: totalCredit - totalSettled });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function addAdvanceTransaction(req, res) {
  try {
    const { staffId } = req.params;

    if (!staffId || staffId === "null" || staffId === "undefined") {
      return res.status(400).json({ message: "Invalid staffId" });
      
    }
    

    const { type, amount, note, paidBy } = req.body;
  

    if (!["credit", "settled"].includes(type))
      return res.status(400).json({ message: "type must be 'credit' or 'settled'" });
    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ message: "amount must be positive" });

    // Use findOneAndUpdate with upsert — this guarantees staffId is always set correctly
    const adv = await StaffAdvance.findOneAndUpdate(
      { staffId },                          // find by staffId
      {
        $setOnInsert: { staffId },           // set staffId only on new doc
        $push: {
          transactions: {
            type,
            amount:  Number(amount),
            note:    note   || "",
            paidBy:  paidBy || "",
            addedBy: req.user?.id,
            date:    new Date(),
          }
        }
      },
      { new: true, upsert: true }           // create if not found
    );

    const obj          = adv.toObject();
    const totalCredit  = obj.transactions.filter(t => t.type === "credit")
                           .reduce((s, t) => s + (t.amount || 0), 0);
    const totalSettled = obj.transactions.filter(t => t.type === "settled")
                           .reduce((s, t) => s + (t.amount || 0), 0);

    res.status(201).json({
      ...obj,
      staffId:   staffId.toString(),
      totalCredit,
      totalSettled,
      outstanding: totalCredit - totalSettled,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// DELETE /staff/advances/:staffId/transaction/:txId
export async function deleteAdvanceTransaction(req, res) {
  try {
    const { staffId, txId } = req.params;
    const adv = await StaffAdvance.findOne({ staffId });
    if (!adv) return res.status(404).json({ message: "Advance record not found" });

    adv.transactions = adv.transactions.filter(t => t._id?.toString() !== txId);
    await adv.save();

    const obj          = adv.toObject();
    const totalCredit  = obj.transactions.filter(t => t.type === "credit") .reduce((s, t) => s + (t.amount || 0), 0);
    const totalSettled = obj.transactions.filter(t => t.type === "settled").reduce((s, t) => s + (t.amount || 0), 0);

    res.json({ ...obj, staffId: staffId.toString(), totalCredit, totalSettled, outstanding: totalCredit - totalSettled });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}