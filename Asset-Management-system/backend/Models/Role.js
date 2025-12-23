import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. doctor, admin, superadmin
  permissions: { type: Object, required: true }, // nested object for module/action permissions
  description: { type: String }
});

export default mongoose.model("Role", roleSchema);
