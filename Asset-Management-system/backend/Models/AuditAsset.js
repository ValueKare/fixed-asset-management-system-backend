import mongoose from "mongoose";
const auditAssetSchema = new mongoose.Schema({
    auditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
      required: true
    },
  
    assetKey: {
      type: String,
      required: true // SQL asset_key
    },
  
    physicalStatus: {
      type: String,
      enum: ["found", "not_found", "damaged", "excess"],
      required: true
    },
  
    systemStatus: {
      type: String,
      enum: ["active", "maintenance", "disposed"],
      required: true
    },
  
    discrepancy: {
      type: Boolean,
      default: false
    },
  
    auditorRemark: String,
  
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee" // auditor
    },
  
    verifiedAt: Date
  }, { timestamps: true });
export default mongoose.model("auditAssetSchema", auditAssetSchema);
  