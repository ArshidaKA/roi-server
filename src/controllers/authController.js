import { validationResult, body } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const validators = {
  register: [
    body("name").notEmpty().withMessage("name required"),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 })
  ],
  login: [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty()
  ],
  staff: [
    body("name").notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 })
  ]
};

function issueToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

// ✅ Register owner (only one allowed)
export async function registerOwner(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const ownerExists = await User.findOne({ role: "OWNER" });
  if (ownerExists) return res.status(400).json({ message: "Owner already exists" });

  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash: hash,
    role: "OWNER"
  });

  const token = issueToken(user);
  res.status(201).json({ user: user.toJSONSafe(), token });
}

// ✅ Login
export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email, active: true });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = issueToken(user);
  res.json({ user: user.toJSONSafe(), token });
}

// ✅ Register staff (only by OWNER)
export async function registerStaff(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  const hash = await bcrypt.hash(password, 10);
  const staff = await User.create({
    name,
    email,
    passwordHash: hash,
    role: "STAFF"
  });

  res.status(201).json({ user: staff.toJSONSafe() });
}

// ✅ Current logged-in user info
export async function me(req, res) {
  res.json({ user: req.user.toJSONSafe() });
}


// ✅ Get all users (only OWNER)
export async function getAllUsers(req, res) {
  try {
    const users = await User.find().select("-passwordHash"); // hide password hash
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
}

// ✅ Register normal user
export async function registerUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "Email already in use" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash: hash,
    role: "USER"
  });

  const token = issueToken(user);
  res.status(201).json({ user: user.toJSONSafe(), token });
}
