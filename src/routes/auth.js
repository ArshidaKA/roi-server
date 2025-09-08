import { Router } from "express";
import { registerOwner, login, registerStaff, me, validators, getAllUsers, registerUser } from "../controllers/authController.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = Router();

router.post("/register", validators.register, registerUser); // 👈 public user registration
router.post("/register-owner", validators.register, registerOwner); // one-time setup
router.post("/login", validators.login, login);
router.post("/staff", auth, requireRole("OWNER"), validators.staff, registerStaff); // create staff users
router.get("/me", auth, me);
router.get("/users", auth, requireRole("OWNER"), getAllUsers);


export default router;
