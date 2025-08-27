import ROI from "../models/roiModel.js";
import { Parser } from "json2csv";

export const exportCSV = async (req, res) => {
  const data = await ROI.find();
  const fields = ["date", "purchase", "revenue", "commissionPercent", "subItems"];
  const parser = new Parser({ fields });
  const csv = parser.parse(data);
  res.header("Content-Type", "text/csv");
  res.attachment("report.csv");
  return res.send(csv);
};

export const getPrintableReport = async (req, res) => {
  const entry = await ROI.findById(req.params.id);
  if (!entry) return res.status(404).json({ message: "Not found" });

  const commission = (entry.revenue * entry.commissionPercent) / 100;
  const gross = entry.revenue - commission;
  const expenses = entry.subItems.reduce((a, s) => a + s.amount, 0);
  const net = gross - entry.purchase - expenses;

  res.json({
    date: entry.date,
    purchase: entry.purchase,
    revenue: entry.revenue,
    commission,
    gross,
    expenses,
    net,
    subItems: entry.subItems,
  });
};
