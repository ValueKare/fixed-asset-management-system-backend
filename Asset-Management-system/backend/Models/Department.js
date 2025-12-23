import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, unique: true },
  description: String,
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" }
});

export default mongoose.model("Department", departmentSchema);
