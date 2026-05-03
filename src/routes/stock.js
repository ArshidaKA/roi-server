// src/routes/stockRoutes.js
import express from "express";
import {
  getStocks,
  getTodayStock,
  getStockSummary,
  createStock,
  updateStock,
  deleteStock,
} from "../controllers/stockController.js";


const router = express.Router();

// All routes require auth
router.use(protect);

// Summary (for dashboard widget)
router.get("/summary", getStockSummary);

// Today's opening+closing pair
router.get("/today", getTodayStock);

// List (with optional filters)
router.get("/", getStocks);

// Create / upsert
router.post("/", createStock);

// Update by id
router.put("/:id", updateStock);

// Delete by id (OWNER only — add role check in middleware if needed)
router.delete("/:id", deleteStock);

export default router;

// ── Register in your main app.js / server.js ──────────────────
// import stockRoutes from "./routes/stockRoutes.js";
// app.use("/api/stock", stockRoutes);