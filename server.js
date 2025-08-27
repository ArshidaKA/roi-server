import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/auth.js";
import roiRoutes from "./src/routes/roi.js";
import adminRoutes from "./src/routes/admin.js";



dotenv.config();
connectDB()



const app = express();
app.use(express.json());
app.use(morgan("dev"));


const allowed = (process.env.CORS_ORIGIN || "").split(",").filter(Boolean);
app.use(
cors({
origin: (origin, cb) => {
if (!origin || allowed.length === 0 || allowed.includes(origin)) return cb(null, true);
return cb(new Error("Not allowed by CORS"));
},
credentials: true
})
);


app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/roi", roiRoutes);
app.use("/api/admin", adminRoutes);




const PORT = process.env.PORT || 5000;



app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

