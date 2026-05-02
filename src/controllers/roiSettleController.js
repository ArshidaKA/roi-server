// src/controllers/roiController.js  — ADD this function to your existing file
import ROIEntry from "../models/ROIEntry.js";

// POST /roi/:id/settle
// Body: { amount, account, note }
// Adds a settlement log entry and recalculates settledAmount
export async function addSettlement(req, res) {
  try {
    const { amount, account, note } = req.body;
    if (!amount || Number(amount) <= 0)
      return res.status(400).json({ message: "Amount must be > 0" });

    const entry = await ROIEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    // Cap: can't settle more than credit
    const currentOutstanding = (entry.creditAmount || 0) - (entry.settledAmount || 0);
    if (Number(amount) > currentOutstanding)
      return res.status(400).json({ message: `Cannot settle more than outstanding: ₹${currentOutstanding}` });

    entry.settlements.push({
      amount:  Number(amount),
      account: account || "",
      note:    note    || "",
      date:    new Date(),
    });

    // Recalculate settledAmount from all settlements
    entry.settledAmount = entry.settlements.reduce((s, sx) => s + (sx.amount || 0), 0);

    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// DELETE /roi/:id/settle/:settlementId
export async function deleteSettlement(req, res) {
  try {
    const entry = await ROIEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: "Entry not found" });

    entry.settlements = entry.settlements.filter(
      sx => sx._id.toString() !== req.params.settlementId
    );
    entry.settledAmount = entry.settlements.reduce((s, sx) => s + (sx.amount || 0), 0);

    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// GET /roi/:id — get single entry (for EntryDetail page)
export async function getEntry(req, res) {
  try {
    const entry = await ROIEntry.findById(req.params.id).populate("createdBy", "name");
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}