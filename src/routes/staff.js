// src/routes/staff.js
import express from "express";
import { getStaff, createStaff, updateStaff, deleteStaff } from "../controllers/staffController.js";
import { getAllAdvances, getAdvanceByStaff, addAdvanceTransaction, deleteAdvanceTransaction } from "../controllers/advanceController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

// Staff CRUD
router.route("/").get(getStaff).post(createStaff);
router.route("/:id").put(updateStaff).delete(deleteStaff);

// Advances
router.get("/advances",                                   getAllAdvances);
router.get("/advances/:staffId",                          getAdvanceByStaff);
router.post("/advances/:staffId",                         addAdvanceTransaction);
router.delete("/advances/:staffId/transaction/:txId",     deleteAdvanceTransaction);

export default router;