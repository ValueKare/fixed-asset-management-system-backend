import mongoose from 'mongoose';

const maintenanceContractSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true },

  contractType: {
    type: String,
    enum: ["AMC", "CMC"],
    required: true
  },

  vendor: String,
  startDate: Date,
  endDate: Date,
  coverageDetails: String,

  isActive: { type: Boolean, default: true }
}, { timestamps: true });


export default mongoose.model('LoginActivity', loginActivitySchema);
