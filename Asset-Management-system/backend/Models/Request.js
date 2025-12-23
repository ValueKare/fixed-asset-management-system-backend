// backend/Models/Request.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const approvalStepSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "skipped"],
      default: "pending",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    date: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const requestSchema = new Schema(
  {
    // Who raised the request
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Basic request details
    assetCategory: {
      type: String,
      required: true,
      trim: true,
    },
    assetName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    justification: {
      type: String,
      required: true,
      trim: true,
    },

    // Status for each level in the approval chain
    approvalFlow: {
      level1: { type: approvalStepSchema, default: () => ({}) },
      level2: { type: approvalStepSchema, default: () => ({}) },
      level3: { type: approvalStepSchema, default: () => ({}) },
      hod: { type: approvalStepSchema, default: () => ({}) },
      inventory: { type: approvalStepSchema, default: () => ({}) },
      purchase: { type: approvalStepSchema, default: () => ({}) },
      budget: { type: approvalStepSchema, default: () => ({}) },
      cfo: { type: approvalStepSchema, default: () => ({}) },
    },

    // Which stage is currently responsible
    currentLevel: {
      type: String,
      enum: [
        "level1",
        "level2",
        "level3",
        "hod",
        "inventory",
        "purchase",
        "budget",
        "cfo",
        "completed",
        "rejected",
      ],
      default: "level1",
    },

    // Overall final status
    finalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Optional extra metadata
    meta: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

const Request = mongoose.model("Request", requestSchema);

export default Request;
