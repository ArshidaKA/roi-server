import Staff from "../models/Staff.js";

export async function getStaff(req, res) {
  try {
    const staff = await Staff.find({ isActive: true });
    res.json(staff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function createStaff(req, res) {
  try {
    const staff = await Staff.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(staff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function updateStaff(req, res) {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(staff);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

export async function deleteStaff(req, res) {
  try {
    await Staff.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Staff deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}