import mongoose from "mongoose";

// models/User.js
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["OWNER", "STAFF", "USER"], default: "USER" }, // 👈 added USER
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.method("toJSONSafe", function () {
  const o = this.toObject();
  delete o.passwordHash;
  return o;
});

export default mongoose.model("User", userSchema);
