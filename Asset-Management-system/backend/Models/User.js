import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  employeeId: { type: String, unique: true },
  organizationId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String },
  ward: { type: String },
  contactNumber: { type: String },
  parentUserId: { type: String },
  permissions: { type: Object, default: {} }, // nested permissions object
  joinedDate: { type: Date },
  status: { type: String, default: "Active" },
  resetPasswordRequired: { type: Boolean, default: false },
  temporaryPassword: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Employee || mongoose.model("Employee", employeeSchema);
// export default mongoose.models.Hospital || mongoose.model("Hospital", hospitalSchema);
