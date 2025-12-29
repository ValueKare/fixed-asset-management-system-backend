import mongoose from "mongoose";

const assetUtilizationLogSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset" },

  status: {
    type: String,
    enum: ["in_use", "not_in_use", "under_maintenance"]
  },

  recordedAt: { type: Date, default: Date.now },
  remarks: String
});


export default mongoose.model("Building", buildingSchema);
