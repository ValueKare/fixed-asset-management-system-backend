import mongoose from "mongoose";

const auditAssetSchema = new mongoose.Schema(
  {
    auditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Audit",
      required: true,
      index: true
    },

    assetKey: {
      type: String,
      required: true,
      index: true
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true
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

    locationMatched: {
      type: Boolean,
      default: true
    },

    discrepancy: {
      type: Boolean,
      default: false
    },

    auditorRemark: String,

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee"
    },

    verifiedAt: Date
  },
  { timestamps: true }
);

/* Prevent duplicate audit of same asset in one audit */
auditAssetSchema.index({ auditId: 1, assetKey: 1 }, { unique: true });

export default mongoose.model("AuditAsset", auditAssetSchema);
