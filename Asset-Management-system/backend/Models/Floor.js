import mongoose from "mongoose";

const floorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  level: { type: Number, required: true },
  departments: [{ type: String }],
  totalAssets: { type: Number, default: 0 },
  buildingId: { type: String, required: true }
});

export default mongoose.model("Floor", floorSchema);
