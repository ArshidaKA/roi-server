import { Router } from "express";
import { auth, requireRole } from "../middleware/auth.js";
import { createEntry, getEditRequests, getEntries, requestEdit, reviewEdit } from "../controllers/roiController.js";

const router = Router();

// router.post("/", auth, requireRole("OWNER"), createEntry);
// router.get("/", auth, getEntries);
router.post("/", createEntry);
router.get("/", getEntries);
router.post("/edit-request", auth, requestEdit);
router.get("/edit-requests", auth, requireRole("OWNER"), getEditRequests);

router.patch("/edit-request/:id", auth, requireRole("OWNER"), reviewEdit);

export default router;