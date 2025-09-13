// routes/authRoutes.js
import { Router } from "express";
import {
  registerOwner,
  login,
  registerStaff,
  me,
  validators,
  getAllUsers,
  registerUser,
} from "../controllers/authController.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/register", validators.register, registerUser);
router.post("/register-owner", validators.register, registerOwner);
router.post("/login", login);

router.post("/staff", auth, requireRole("OWNER"), validators.staff, registerStaff);
router.get("/me", auth, me);
router.get("/users", auth, requireRole("OWNER"), getAllUsers);

export default router;
