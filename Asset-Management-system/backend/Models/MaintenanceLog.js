import mongoose from "mongoose";

const maintenanceLogSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset" },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  maintenanceType: { type: String, enum: ["preventive", "corrective"] },
  date: { type: Date, required: true },
  performedBy: String,
  cost: Number,
  remarks: String,
  status: { type: String, enum: ["scheduled", "completed"], default: "scheduled" }
});

export default mongoose.model("MaintenanceLog", maintenanceLogSchema);
