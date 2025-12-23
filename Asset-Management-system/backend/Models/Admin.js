import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  name: { type: String },
  role: { type: String, default: "admin" },
  panel: { type: String, required: true }, // e.g., superadmin, superduper admin, etc.
  createdAt: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  lastLogout: { type: Date }
});


const Admin = mongoose.model("Admin", adminSchema);
export default Admin;


