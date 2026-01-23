import mongoose from "mongoose";
const auditSchema = new mongoose.Schema({
    auditCode: {
      type: String,
      unique: true,
      required: true
    },
  
    organizationId: {
      type: String,
      required: true
    },
  
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true
    },
  
    auditType: {
      type: String,
      enum: ["statutory", "internal", "physical", "surprise"],
      required: true
    },
  
    periodFrom: Date,
    periodTo: Date,
  
    status: {
      type: String,
      enum: ["planned", "in_progress", "submitted", "closed"],
      default: "planned"
    },
  
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true
    },
  
    assignedAuditors: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee" // auditors
    }],
  
    startedAt: Date,
    submittedAt: Date,
    closedAt: Date,
  
    remarks: String
  }, { timestamps: true });
  export default mongoose.model("Audit", auditSchema);
            