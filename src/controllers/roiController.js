// controllers/roiController.js
import ROIEntry from "../models/ROIEntry.js";
import EditRequest from "../models/EditRequest.js";

// Create ROI Entry (OWNER)
export async function createEntry(req, res) {
  try {
    const entry = await ROIEntry.create({ ...req.body, createdBy: req?.user?.id });
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get single entry by id
export async function getEntryById(req, res) {
  try {
    const { id } = req.params;
    const entry = await ROIEntry.findById(id);
    if (!entry) return res.status(404).json({ message: "Not found" });
    res.json(entry);
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
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
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
    } else {
      // lifetime
      query.date = { $lte: new Date() };
    }

    const entries = await ROIEntry.find(query).sort({ date: 1 });
    res.json(entries);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Request Edit (any authenticated user; typically STAFF)
export async function requestEdit(req, res) {
  try {
    const { entryId, fieldPath, newValue, reason } = req.body;
    const request = await EditRequest.create({
      entryId,
      fieldPath,
      newValue,
      reason,
      requestedBy: req.user.id,
    });
    res.status(201).json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Pending requests count (STAFF sees own; OWNER sees all)
export async function getPendingRequestsCount(req, res) {
  try {
    let query = { status: "PENDING" };
    if (req.user.role === "STAFF") query.requestedBy = req.user.id;
    const count = await EditRequest.countDocuments(query);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: "Error fetching pending requests count" });
  }
}

// OWNER reviews a request
export async function reviewEdit(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // "APPROVED" | "REJECTED"
    const request = await EditRequest.findById(id);
    if (!request) return res.status(404).json({ message: "Not found" });

    // NEW BEHAVIOR:
    // On APPROVED, we DO NOT apply change immediately.
    // We only grant permission; the STAFF will perform the edit via /roi/:id/staff-update.
    request.status = status;
    request.reviewedBy = req.user.id;
    await request.save();

    res.json(request);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Get Edit Requests (with filters & pagination)
export async function getEditRequests(req, res) {
  try {
    let query = {};
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      entryId,
      mine,
    } = req.query;

    // If STAFF → only their requests
    if (req.user.role === "STAFF") {
      query.requestedBy = req.user.id;
    }

    // If explicitly ask for mine=true, restrict to current user
    if (mine === "true" || mine === "1") {
      query.requestedBy = req.user.id;
    }

    if (status && status !== "ALL") query.status = status;
    if (entryId) query.entryId = entryId;

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const requests = await EditRequest.find(query)
      .populate("requestedBy", "name email")
      .sort({ createdAt: -1 })
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

// OWNER updates any entry
export async function updateEntry(req, res) {
  try {
    const { id } = req.params;
    const updated = await ROIEntry.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Entry not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// STAFF updates only approved fields for that entry (and consumes approvals)
export async function staffUpdateEntry(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { updates } = req.body; // [{ path: "expenses.rent", value: 12000 }, ...]

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "No updates provided" });
    }

    const paths = updates.map((u) => u.path);

    const approved = await EditRequest.find({
      entryId: id,
      requestedBy: userId,
      status: "APPROVED",
      consumed: false,
      fieldPath: { $in: paths },
    });

    if (approved.length !== updates.length) {
      return res.status(403).json({ message: "One or more fields not approved" });
    }

    const setObj = {};
    updates.forEach((u) => {
      // convert "purchaseCost[0].amount" → "purchaseCost.0.amount"
      const fixedPath = u.path.replace(/\[(\d+)\]/g, ".$1");
      setObj[fixedPath] = u.value;
    });

    const updatedEntry = await ROIEntry.findByIdAndUpdate(
      id,
      { $set: setObj },
      { new: true }
    );

    await EditRequest.updateMany(
      {
        entryId: id,
        requestedBy: userId,
        status: "APPROVED",
        consumed: false,
        fieldPath: { $in: paths },
      },
      { $set: { consumed: true } }
    );

    res.json(updatedEntry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

