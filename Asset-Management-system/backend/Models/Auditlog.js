// backend/Models/AuditLog.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  role: { type: String },
  details: { type: String },
  entityType: { type: String }, // Asset, Transfer, Scrap
  entityId: { type: mongoose.Schema.Types.ObjectId },

}, { timestamps: true });

export default mongoose.model("AuditLog", auditLogSchema);
