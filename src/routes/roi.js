// routes/roiRoutes.js
import { Router } from "express";
import { auth, requireRole } from "../middleware/auth.js";
import {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  staffUpdateEntry,
  requestEdit,
  getEditRequests,
  reviewEdit,
  getPendingRequestsCount,
} from "../controllers/roiController.js";

const router = Router();

// Counts
router.get("/edit-requests/pending/count", auth, getPendingRequestsCount);

// Edit requests (specific first!)
router.get("/edit-requests", auth, getEditRequests);
router.post("/edit-request", auth, requestEdit);
router.patch("/edit-request/:id", auth, requireRole("OWNER"), reviewEdit);

// ROI CRUD (generic last)

router.post("/", auth, requireRole(["OWNER", "STAFF"]), createEntry);
router.get("/", auth, getEntries);
router.get("/:id", auth, getEntryById);
router.put("/:id", auth, requireRole("OWNER"), updateEntry);

// Staff-limited update
router.patch("/:id/staff-update", auth, requireRole("STAFF"), staffUpdateEntry);

export default router;
