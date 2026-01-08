import mongoose from "mongoose";


const floorSchema = new mongoose.Schema(
  {
    floorId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true
    },

    level: {
      type: Number,
      required: true
    },

    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
      index: true
    },

    buildingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Building",
      required: true,
      index: true
    },

    totalAssets: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.models.Floor || mongoose.model("Floor", floorSchema);

