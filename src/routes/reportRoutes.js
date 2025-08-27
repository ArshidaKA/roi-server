import express from "express";
import { exportCSV, getPrintableReport } from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/export", protect, exportCSV);
router.get("/print/:id", protect, getPrintableReport);

export default router;
