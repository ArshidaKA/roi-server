import express from "express";
import {
  markAttendance,
  getAttendance,
  updateAttendance,
  getMonthlyAttendance,
  getSalarySummary
} from "../controllers/attendanceController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.route("/")
  .get(getAttendance)
  .post( markAttendance)
  .put( updateAttendance);

router.get("/monthly", getMonthlyAttendance);
router.get("/salary-summary", getSalarySummary); // 👈 add this


export default router;