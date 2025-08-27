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


// Get ROI Entries with filters (today / monthly / custom)
export async function getEntries(req, res) {
  try {
    const { filter, startDate, endDate } = req.query;
    let query = {};

    if (filter === "today") {
      const today = new Date();
      query.date = {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lte: new Date(today.setHours(23, 59, 59, 999)),
      };
    } else if (filter === "monthly") {
      const now = new Date();
      query.date = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        ),
      };
    } else if (filter === "custom" && startDate && endDate) {
      query.date = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const entries = await ROIEntry.find(query).sort({ date: 1 });
    res.json(entries);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
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
// Get Edit Requests
export async function getEditRequests(req, res) {
  try {
    let query = {};

    // If staff -> only their requests
    if (req.user.role === "STAFF") {
      query.requestedBy = req.user.id;
    }

    const requests = await EditRequest.find(query)
      .populate("requestedBy", "name email");

    res.json(requests);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}
