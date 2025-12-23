import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String },
  building: { type: String },
  floor: { type: String },
  headOfDepartment: { type: String },
  totalAssets: { type: Number, default: 0 },
  totalStaff: { type: Number, default: 0 },
  costCenters: [{ type: String }]
});

export default mongoose.model("Department", departmentSchema);
