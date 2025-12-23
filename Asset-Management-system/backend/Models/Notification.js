import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    priority: { type: String, enum: ["critical", "warning", "info", "success"], required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    from: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true }
    },
    metadata: { type: Object, default: {} },
    read: { type: Boolean, default: false },
    timestamp: { type: Date, required: true }
  },
  { timestamps: false }
);

export default mongoose.model("Notification", notificationSchema);
