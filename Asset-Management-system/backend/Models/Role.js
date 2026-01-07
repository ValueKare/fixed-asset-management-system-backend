import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    // Role identity
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      // examples: superadmin, admin, auditor, doctor, nurse, inventory
    },

    description: {
      type: String,
      default: "",
    },

    // High-level role category (important for audits & UI)
    roleType: {
      type: String,
      enum: ["system", "organization", "audit", "employee"],
      required: true,
      // system → superadmin
      // organization → admin
      // audit → auditor
      // employee → doctor, nurse, staff, etc.
    },

    // Granular permission matrix
    permissions: {
      // ---- Asset Module ----
      asset: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        transfer: { type: Boolean, default: false },
        scrap_request: { type: Boolean, default: false },
        scrap_approve: { type: Boolean, default: false },
      },

      // ---- Audit Module ----
      audit: {
        initiate: { type: Boolean, default: false },   // Admin
        assign: { type: Boolean, default: false },     // Admin / SuperAdmin
        verify: { type: Boolean, default: false },     // Auditor
        submit: { type: Boolean, default: false },     // Auditor
        close: { type: Boolean, default: false },      // Admin / SuperAdmin
        view_reports: { type: Boolean, default: false },
      },

      // ---- Maintenance Module ----
      maintenance: {
        log: { type: Boolean, default: false },
        view: { type: Boolean, default: false },
        approve: { type: Boolean, default: false },
      },

      // ---- User & Role Management ----  //schema of updating the true values
      user: {
        create: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        suspend: { type: Boolean, default: false },
        assign_role: { type: Boolean, default: false },
      },

      // ---- Approval & Workflow ----
      approval: {
        asset_transfer: { type: Boolean, default: false },
        procurement: { type: Boolean, default: false },
        scrap: { type: Boolean, default: false },
      },

      // ---- Reporting & Analytics ----
      reports: {
        asset_utilization: { type: Boolean, default: false },
        maintenance: { type: Boolean, default: false },
        audit: { type: Boolean, default: false },
      },

      // ---- System Level (SuperAdmin only) ----
      system: {
        manage_organizations: { type: Boolean, default: false },
        manage_hospitals: { type: Boolean, default: false },
        view_all_data: { type: Boolean, default: false },
      },
    },

    // Safety switch
    isSystemRole: {
      type: Boolean,
      default: false,
      // true for superadmin, auditor (protected roles)
    },
  },
  { timestamps: true }
);


export default mongoose.model("Role", roleSchema);
