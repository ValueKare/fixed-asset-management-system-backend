import mongoose from "mongoose";

const costCenterSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true },
  name: { type: String, required: true },
  department: { type: String },
  budgetAllocated: { type: Number, default: 0 },
  budgetUtilized: { type: Number, default: 0 },
  totalAssets: { type: Number, default: 0 },
  organizationId: { type: String, required: true }
});

export default mongoose.model("CostCenter", costCenterSchema);
