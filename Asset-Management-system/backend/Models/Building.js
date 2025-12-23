import mongoose from "mongoose";

const buildingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String },
  totalFloors: { type: Number, default: 0 },
  totalDepartments: { type: Number, default: 0 },
  totalAssets: { type: Number, default: 0 },
  address: { type: String },
  organizationId: { type: String, required: true }
});

export default mongoose.model("Building", buildingSchema);
