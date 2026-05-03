// src/controllers/stockController.js
import Stock from "../models/Stock.js";

// ── Helper: normalize date to midnight UTC ────────────────────
const toDay = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// ── GET /stock ────────────────────────────────────────────────
// Query params: date (YYYY-MM-DD), type (opening|closing), startDate, endDate
export const getStocks = async (req, res) => {
  try {
    const { date, type, startDate, endDate } = req.query;
    const filter = {};

    if (date) {
      const d = toDay(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    } else if (startDate && endDate) {
      filter.date = { $gte: toDay(startDate), $lte: toDay(endDate) };
    }

    if (type) filter.type = type;

    const stocks = await Stock.find(filter)
      .sort({ date: -1, type: 1 })
      .populate("createdBy", "name");

    res.json(stocks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /stock/today ──────────────────────────────────────────
// Returns { opening, closing } for today
export const getTodayStock = async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().split("T")[0];
    const d    = toDay(dateStr);
    const next = new Date(d); next.setDate(next.getDate() + 1);

    const [opening, closing] = await Promise.all([
      Stock.findOne({ date: { $gte: d, $lt: next }, type: "opening" }),
      Stock.findOne({ date: { $gte: d, $lt: next }, type: "closing" }),
    ]);

    res.json({ opening, closing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /stock/summary ────────────────────────────────────────
// Returns aggregated opening/closing by date range for dashboard
export const getStockSummary = async (req, res) => {
  try {
    const { filter = "thisMonth", startDate, endDate } = req.query;

    let dateFilter = {};
    const now = new Date();
    if (filter === "today") {
      const d = toDay(now);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      dateFilter = { $gte: d, $lt: next };
    } else if (filter === "thisMonth") {
      dateFilter = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    } else if (filter === "thisYear") {
      dateFilter = { $gte: new Date(now.getFullYear(), 0, 1) };
    } else if (filter === "custom" && startDate && endDate) {
      dateFilter = { $gte: toDay(startDate), $lte: toDay(endDate) };
    }

    const query = Object.keys(dateFilter).length ? { date: dateFilter } : {};
    const stocks = await Stock.find(query).sort({ date: -1 });

    const latestOpening = stocks.find(s => s.type === "opening");
    const latestClosing = stocks.find(s => s.type === "closing");

    const totalOpeningValue = stocks.filter(s => s.type === "opening").reduce((sum, s) => sum + (s.totalValue || 0), 0);
    const totalClosingValue = stocks.filter(s => s.type === "closing").reduce((sum, s) => sum + (s.totalValue || 0), 0);

    res.json({
      latestOpening,
      latestClosing,
      totalOpeningValue,
      totalClosingValue,
      stockDifference: totalClosingValue - totalOpeningValue,
      count: stocks.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /stock ───────────────────────────────────────────────
export const createStock = async (req, res) => {
  try {
    const { date, type, items, notes } = req.body;

    if (!date || !type || !["opening", "closing"].includes(type)) {
      return res.status(400).json({ message: "date and type (opening|closing) are required." });
    }

    const d = toDay(date);

    // Upsert: if same date+type exists, update it
    const existing = await Stock.findOne({ date: d, type });
    if (existing) {
      existing.items     = items || [];
      existing.notes     = notes || "";
      existing.createdBy = req.user?.id;
      existing.totalValue = (items || []).reduce((s, i) => s + (i.amount || 0), 0);
      await existing.save();
      return res.json(existing);
    }

    const stock = new Stock({
      date:      d,
      type,
      items:     items || [],
      notes:     notes || "",
      createdBy: req.user?.id,
    });
    await stock.save();
    res.status(201).json(stock);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Stock entry for this date and type already exists." });
    }
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /stock/:id ────────────────────────────────────────────
export const updateStock = async (req, res) => {
  try {
    const { items, notes } = req.body;
    const stock = await Stock.findById(req.params.id);
    if (!stock) return res.status(404).json({ message: "Stock entry not found." });

    if (items !== undefined) stock.items = items;
    if (notes !== undefined) stock.notes = notes;
    stock.totalValue = (stock.items).reduce((s, i) => s + (i.amount || 0), 0);

    await stock.save();
    res.json(stock);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /stock/:id ─────────────────────────────────────────
export const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findByIdAndDelete(req.params.id);
    if (!stock) return res.status(404).json({ message: "Not found." });
    res.json({ message: "Deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};