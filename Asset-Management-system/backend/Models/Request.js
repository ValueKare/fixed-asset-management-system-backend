import mongoose from "mongoose";

const { Schema } = mongoose;

/* ================= APPROVAL STEP ================= */

const approvalStepSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
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

/* ================= REQUEST SCHEMA ================= */

const requestSchema = new Schema(
  {
    /* ---------- REQUEST CREATOR ---------- */
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },

    /* ---------- REQUEST TYPE ---------- */
    requestType: {
      type: String,
      enum: ["asset_transfer", "procurement", "scrap", "scrap_reversal"],
      required: true,
      index: true,
    },

    /* ---------- DISCOVERY (OPTIONAL) ---------- */
    assetCategory: {
      type: String,
      trim: true,
    },

    assetName: {
      type: String,
      trim: true,
    },

    /* ---------- MODE 1: SPECIFIC ASSET(S) ---------- */
    requestedAssets: [
      {
        type: Schema.Types.ObjectId,
        ref: "Asset",
      },
    ],

    /* ---------- MODE 2: COUNT-BASED REQUEST ---------- */
    fulfillment: {
      requestedCount: {
        type: Number,
        min: 1,
      },
      fulfilledCount: {
        type: Number,
        default: 0,
      },
      fulfilledAssets: [
        {
          assetId: {
            type: Schema.Types.ObjectId,
            ref: "Asset",
            required: true,
          },
          fromDepartmentId: {
            type: Schema.Types.ObjectId,
            ref: "Department",
            required: true,
          },
          fulfilledBy: {
            type: Schema.Types.ObjectId,
            ref: "Employee",
            required: true,
          },
          fulfilledAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    /* ---------- BUSINESS CONTEXT ---------- */
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

    estimatedCost: {
      type: Number,
      default: 0,
    },

    /* ---------- APPROVAL FLOW (ONLY 3 LEVELS) ---------- */
    approvalFlow: {
      level1: { type: approvalStepSchema, default: () => ({}) }, // informational
      hod: { type: approvalStepSchema, default: () => ({}) },
      cfo: { type: approvalStepSchema, default: () => ({}) },
    },

    /* ---------- CURRENT STATE ---------- */
    currentLevel: {
      type: String,
      enum: ["level1", "hod", "cfo", "completed", "rejected"],
      default: "level1",
      index: true,
    },

    finalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    /* ---------- REQUEST SCOPE ---------- */
    scope: {
      level: {
        type: String,
        enum: ["department", "hospital", "organization"],
        required: true,
      },
      departmentId: {
        type: Schema.Types.ObjectId,
        ref: "Department",
        required: true,
      },
      hospitalId: {
        type: Schema.Types.ObjectId,
        ref: "Hospital",
        required: true,
      },
      organizationId: {
        type: Schema.Types.ObjectId,
        ref: "Entity",
        required: true,
      },
    },

    /* ---------- ESCALATION ---------- */
    escalation: {
      enabled: {
        type: Boolean,
        default: true,
      },
      escalateAfterHours: {
        type: Number,
        default: 24,
      },
      lastActionAt: {
        type: Date,
        default: Date.now,
      },
    },

    /* ---------- META ---------- */
    meta: {
      type: Object,
      default: {},
    },

    /* ---------- REJECTED ASSETS ---------- */
    rejectedAssets: [
      {
        assetId: {
          type: Schema.Types.ObjectId,
          ref: "Asset",
          required: true,
        },
        fromDepartmentId: {
          type: Schema.Types.ObjectId,
          ref: "Department",
          required: true,
        },
        rejectedAt: {
          type: Date,
          default: Date.now,
        },
        rejectedBy: {
          type: Schema.Types.ObjectId,
          ref: "Employee",
          required: true,
        },
        remarks: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

/* ================= VALIDATION ================= */
/* EXACTLY ONE of requestedAssets OR fulfillment.requestedCount */

requestSchema.pre("validate", function (next) {
  const hasAssets =
    Array.isArray(this.requestedAssets) && this.requestedAssets.length > 0;

  const hasCount =
    this.fulfillment &&
    typeof this.fulfillment.requestedCount === "number" &&
    this.fulfillment.requestedCount > 0;

  if (!hasAssets && !hasCount) {
    return next(
      new Error(
        "Either requestedAssets or fulfillment.requestedCount must be provided"
      )
    );
  }

  if (hasAssets && hasCount) {
    return next(
      new Error(
        "Use either requestedAssets OR fulfillment.requestedCount, not both"
      )
    );
  }

  next();
});

/* ================= EXPORT ================= */

const Request = mongoose.model("Request", requestSchema);
export default Request;
