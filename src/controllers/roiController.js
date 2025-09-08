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


// Get ROI Entries with filters (today / thisMonth / thisYear / custom / lifetime)
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
    } else if (filter === "thisMonth") {
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
    } else if (filter === "thisYear") {
      const now = new Date();
      query.date = {
        $gte: new Date(now.getFullYear(), 0, 1),
        $lte: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
      };
    } else if (filter === "custom" && startDate && endDate) {
      query.date = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    } 
    // ✅ Default: lifetime (till now)
    else {
      query.date = {
        $lte: new Date(), // everything before or equal to now
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

// controllers/roiController.js
export async function getPendingRequestsCount(req, res) {
  try {
    let query = { status: "PENDING" };

    // If staff -> only their own pending requests
    if (req.user.role === "STAFF") {
      query.requestedBy = req.user.id;
    }

    const count = await EditRequest.countDocuments(query);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Error fetching pending requests count" });
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
// controllers/roiController.js
export async function getEditRequests(req, res) {
  try {
    let query = {};
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Filter by role (staff only sees their own)
    if (req.user.role === "STAFF") {
      query.requestedBy = req.user.id;
    }

    // Filter by status
    if (status && status !== "ALL") {
      query.status = status;
    }

    // Filter by date
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Fetch data with pagination + latest first
    const requests = await EditRequest.find(query)
      .populate("requestedBy", "name email")
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(Number(limit));

    const total = await EditRequest.countDocuments(query);

    res.json({
      requests,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

