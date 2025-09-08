import { Router } from "express";
import { auth, requireRole } from "../middleware/auth.js";
import { createEntry, getEditRequests, getEntries, requestEdit, reviewEdit } from "../controllers/roiController.js";
import { getPendingRequestsCount } from "../controllers/roiController.js";


const router = Router();

// routes/roiRoutes.js

router.get("/edit-requests/pending/count", auth, getPendingRequestsCount);

// router.post("/", auth, requireRole("OWNER"), createEntry);
// router.get("/", auth, getEntries);
router.post("/", createEntry);
router.get("/", getEntries);

router.post("/edit-request", auth, requestEdit);
router.get("/edit-requests", auth, getEditRequests);


router.patch("/edit-request/:id", auth, requireRole("OWNER"), reviewEdit);


export default router;