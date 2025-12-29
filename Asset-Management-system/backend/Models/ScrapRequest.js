// models/ScrapRequest.js
import mongoose from "mongoose";

const scrapRequestSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },

    reason: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null
    },

    decisionDate: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("ScrapRequest", scrapRequestSchema);
