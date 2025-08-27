import ROIEntry from "../models/ROIEntry.js";
import EditRequest from "../models/EditRequest.js";

// Create ROI Entry
export async function createEntry(req, res) {
  try {
    const entry = await ROIEntry.create({ ...req.body, createdBy: req?.user?.id });
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get entries (daily/monthly)
export async function getEntries(req, res) {
  const { filter } = req.query; // daily | monthly | all
  let query = {};
  if (filter === "daily") {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    query.date = { $gte: today, $lt: tomorrow };
  } else if (filter === "monthly") {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth()+1, 1);
    query.date = { $gte: start, $lt: end };
  }
  const entries = await ROIEntry.find(query).sort({ date: -1 });
  res.json(entries);
}

// Request Edit
export async function requestEdit(req, res) {
  try {
    const { entryId, fieldPath, newValue, reason } = req.body;
    const request = await EditRequest.create({ entryId, fieldPath, newValue, reason, requestedBy: req.user.id });
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Approve/Reject Edit (Owner only)
export async function reviewEdit(req, res) {
  const { id } = req.params;
  const { status } = req.body; // APPROVED | REJECTED
  const request = await EditRequest.findById(id);
  if (!request) return res.status(404).json({ message: "Not found" });

  if (status === "APPROVED") {
    // Apply change to ROIEntry
    await ROIEntry.updateOne(
      { _id: request.entryId },
      { $set: { [request.fieldPath]: request.newValue } }
    );
  }
  request.status = status;
  request.reviewedBy = req.user.id;
  await request.save();
  res.json(request);
}
export async function getEditRequests(req, res) {
  try {
    const requests = await EditRequest.find().populate("requestedBy", "name email");
    res.json(requests);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}