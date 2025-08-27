import { Router } from "express";
import { auth, requireRole } from "../middleware/auth.js";
import EditRequest from "../models/EditRequest.js";


const router = Router();


router.get("/requests", auth, requireRole("OWNER"), async(req,res)=>{
const items = await EditRequest.find({ status: "PENDING" }).sort({ createdAt: -1 });
res.json(items);
});


export default router;