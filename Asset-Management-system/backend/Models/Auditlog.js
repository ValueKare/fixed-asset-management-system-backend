// backend/Models/AuditLog.js
import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true
      // e.g. ASSET_CREATED, AUDIT_STARTED, AUDIT_VERIFIED
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true
    },

    userRole: {
      type: String,
      required: true
      // superadmin, audit_admin, dept_admin
    },

    entityType: {
      type: String,
      required: true,
      index: true
      // Asset, Audit, AuditAsset, Transfer, Scrap
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      index: true
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },

    details: {
      type: String
      // Human-readable explanation
    },

    meta: {
      type: Object
      // Before/After values, IP, device, etc.
    },

    ipAddress: String
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
