// src/routes/roi.js
import express from "express";
import { auth } from "../middleware/auth.js";

import {
  createEntry,
  getEntries,
  getEntryById,
  updateEntry,
  requestEdit,
  reviewEdit,
  getEditRequests,
  getPendingRequestsCount,
  staffUpdateEntry,
} from "../controllers/roiController.js";

import {
  addSettlement,
  deleteSettlement,
} from "../controllers/roiSettleController.js";

const router = express.Router();
router.use(auth);

router.route("/").get(getEntries).post(createEntry);

router.get("/edit-requests",               getEditRequests);
router.get("/pending-count",               getPendingRequestsCount);
router.post("/edit-request",               requestEdit);
router.patch("/edit-request/:id",          reviewEdit);

router.get("/:id",                         getEntryById);
router.put("/:id",                         updateEntry);
router.post("/:id/staff-update",           staffUpdateEntry);
router.post("/:id/settle",                 addSettlement);
router.delete("/:id/settle/:settlementId", deleteSettlement);

export default router;