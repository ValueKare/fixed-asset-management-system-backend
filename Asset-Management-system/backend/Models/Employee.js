import mongoose from "mongoose";
import bcrypt from "bcrypt";

const employeeSchema = new mongoose.Schema(
  {
    // ---- Identity ----
    userId: {
      type: String,
      unique: true,
      index: true,
    },

    empId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // ---- Organization / Hospital Linkage ----
    organizationId: {
      type: String,
      required: true,
    },

    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    department: {
      type: String,
      trim: true,
    },

    ward: {
      type: String,
      trim: true,
    },

    // ---- Role & Authority ----
    role: {
      type: String,
      required: true,
      // examples: admin, hod, inventory, purchase, cfo
    },

    panel: {
      type: String,
      required: true,
      // examples: doctor, nurse, technician, staff
    },

    parentUserId: {
      type: String,
      default: null,
      // reporting hierarchy (HOD / supervisor)
    },

    permissions: {
      type: Object,
      default: {},
      // fine-grained permissions
    },

    // ---- Status & Lifecycle ----
    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },

    joinedDate: {
      type: Date,
    },

    // ---- Login / Activity Tracking ----
    isOnline: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
    },

    lastLogout: {
      type: Date,
    },

    // ---- Password Reset Flow ----
    resetPasswordRequired: {
      type: Boolean,
      default: false,
    },

    temporaryPassword: {
      type: String,
      default: null,
    },

    // ---- Contact ----
    contactNumber: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // automatically adds createdAt & updatedAt
  }
);

//
// 🔐 Password Hashing
//
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//
// 🔑 Password Comparison
//
employeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Employee", employeeSchema);
