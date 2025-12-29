import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    assetName: {
      type: String,
      required: true
    },

    assetCode: {
      type: String,
      unique: true
    },

    category: {
      type: String
    },

    assetType: {
      type: String,
      enum: ["movable", "non_movable"],
      required: true
    },

    costCentre: {
      type: String
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department"
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital"
    },

    building: String,
    floor: String,
    vendor: String,

    utilizationStatus: {
      type: String,
      enum: ["in_use", "not_in_use", "under_maintenance"],
      default: "not_in_use"
    },

    lifecycleStatus: {
      type: String,
      enum: ["active", "pending_scrap", "scrapped"],
      default: "active"
    },

    maintenanceCount: {
      type: Number,
      default: 0
    },

    purchaseDate: Date,
    warranty: String,
    barcode: String,

    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const Asset = mongoose.models.Asset || mongoose.model("Asset", assetSchema);
export default Asset;