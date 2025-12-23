import mongoose from "mongoose";
import bcrypt from "bcrypt";

const employeeSchema = new mongoose.Schema({
  empId: { type: String, required: true, unique: true },
  name: { type: String },
  department: { type: String },
  email: { type: String },
  password: { type: String, required: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true }, // for organization linkage
  panel: { type: String, required: true }, // e.g. doctor, nurse, etc.
  ward: { type: String },
  isOnline: { type: Boolean, default: false },
  lastLogin: { type: Date },
  lastLogout: { type: Date }
});

employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

employeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Employee", employeeSchema);
