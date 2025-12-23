import mongoose from "mongoose";

const assetSchema = new mongoose.Schema({
  assetName: { type: String, required: true },
  assetCode: { type: String, unique: true },
  category: { type: String },
  costCentre: { type: String },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  building: String,
  floor: String,
  vendor: String,
  status: {
    type: String,
    enum: ["active", "maintenance", "disposed"],
    default: "active",
  },
  purchaseDate: Date,
  warranty: String,
  barcode: String,
  createdAt: { type: Date, default: Date.now },
});

const Asset = mongoose.model("Asset", assetSchema);
export default Asset;
