import mongoose from "mongoose";

const assetSchema = new mongoose.Schema({
  assetName: { type: String, required: true },
  assetCode: { type: String, unique: true },
  purchaseCost: { type: Number, required: true },
  assetKey: {
    type: String,
    required: true,
    index: true
  },
  quantity: { type: String, required: true },
  category: { type: String },
  costCentre: { type: String },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Building",
  },
  floorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Floor",
  },
  vendor: String,

  status: {
    type: String,
    enum: ["active", "maintenance", "disposed"],
    default: "active",
  },
  purchaseDate: Date,
  warranty: String,
  assetType: {
    type: String,
    enum: ["movable", "non_movable"],
    required: true
  },

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

  barcode: String,
  createdAt: { type: Date, default: Date.now },
  maintenanceCost: { type: Number, default: 0 },
  amcEndDate: Date,
});
const Asset = mongoose.models.Asset || mongoose.model("Asset", assetSchema);




export default Asset;