import express from "express";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff
} from "../controllers/staffController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.route("/")
  .get(getStaff)
  .post( createStaff);

router.route("/:id")
  .put( updateStaff)
  .delete( deleteStaff);

export default router;