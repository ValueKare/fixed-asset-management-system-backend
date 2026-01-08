import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    departmentId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    name: {
      type: String,
      required: true
    },

    code: {
      type: String,
      trim: true
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
      index: true
    },

    floorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      index: true
    },

    headOfDepartment: {
      type: String,
      trim: true
    },

    totalAssets: {
      type: Number,
      default: 0
    },

    totalStaff: {
      type: Number,
      default: 0
    },

    costCenters: [
      {
        type: String,
        trim: true
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.models.Department ||
  mongoose.model("Department", departmentSchema);

