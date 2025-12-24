import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  name: { type: String },
  role: {
    type: String,
    enum: ["admin", "superadmin"],
    default: "admin"
  },
  panel: { type: String, required: true }, // e.g., superadmin, superduper admin, etc.
  permissions: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }, // For granular permissions control
  createdAt: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  lastActive: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  lastLogout: { type: Date },
  organizationId: { type: String, required: true }, // For superadmin
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" } // For admins created by superadmin
});


const Admin = mongoose.model("Admin", adminSchema);
export default Admin;


