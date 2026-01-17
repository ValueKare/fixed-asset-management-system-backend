// backend/controllers/auditController.js

import Audit from "../Models/Audit.js";
import AuditAsset from "../Models/AuditAsset.js";
import Asset from "../Models/Asset.js";
import {
  logAuditStarted,
  logAuditAssetVerified
} from "../utils/auditLogger.js";

/* ======================================================
   1️⃣ INITIATE AUDIT
   Creates audit master & assigns assets
====================================================== */

export const initiateAudit = async (req, res) => {
  try {
    const {
      auditCode,
      hospitalId,
      auditType,
      periodFrom,
      periodTo,
      assignedAuditors
    } = req.body;

    if (!auditCode || !hospitalId || !auditType) {
      return res.status(400).json({
        message: "auditCode, hospitalId, auditType are required"
      });
    }

    // Create Audit (Master)
    const audit = await Audit.create({
      auditCode,
      hospitalId,
      organizationId: req.user.organizationId,
      auditType,
      periodFrom,
      periodTo,
      initiatedBy: req.user._id,
      assignedAuditors,
      status: "in_progress",
      startedAt: new Date()
    });

    // Fetch all assets for this hospital
    const assets = await Asset.find({ hospitalId });

    // Create audit-asset records
    const auditAssets = assets.map(asset => ({
      auditId: audit._id,
      assetKey: asset.assetKey,
      hospitalId,
      systemStatus: asset.status,
      physicalStatus: "found" // default, will be updated by auditor
    }));

    await AuditAsset.insertMany(auditAssets);

    // Audit Log
    await logAuditStarted(req, audit);

    return res.status(201).json({
      message: "Audit initiated successfully",
      auditId: audit._id,
      totalAssets: auditAssets.length
    });

  } catch (err) {
    console.error("❌ initiateAudit failed:", err);
    return res.status(500).json({
      message: "Failed to initiate audit",
      error: err.message
    });
  }
};

/* ======================================================
   2️⃣ VERIFY ASSET DURING AUDIT
====================================================== */

export const verifyAuditAsset = async (req, res) => {
  try {
    const { auditId, assetKey } = req.params;
    const { physicalStatus, auditorRemark, locationMatched = true } = req.body;

    if (!physicalStatus) {
      return res.status(400).json({
        message: "physicalStatus is required"
      });
    }

    const auditAsset = await AuditAsset.findOne({
      auditId,
      assetKey
    });

    if (!auditAsset) {
      return res.status(404).json({
        message: "Audit asset not found"
      });
    }

    const discrepancy =
      physicalStatus !== "found" || locationMatched === false;

    auditAsset.physicalStatus = physicalStatus;
    auditAsset.locationMatched = locationMatched;
    auditAsset.discrepancy = discrepancy;
    auditAsset.auditorRemark = auditorRemark;
    auditAsset.verifiedBy = req.user._id;
    auditAsset.verifiedAt = new Date();

    await auditAsset.save();

    // Audit Log
    await logAuditAssetVerified({
      auditorId: req.user._id,
      hospitalId: auditAsset.hospitalId,
      auditAsset,
      assetKey,
      physicalStatus,
      remark: auditorRemark
    });

    return res.json({
      message: "Asset verified successfully",
      discrepancy
    });

  } catch (err) {
    console.error("❌ verifyAuditAsset failed:", err);
    return res.status(500).json({
      message: "Failed to verify asset",
      error: err.message
    });
  }
};

/* ======================================================
   3️⃣ SUBMIT AUDIT
====================================================== */

export const submitAudit = async (req, res) => {
  try {
    const { auditId } = req.params;

    const audit = await Audit.findById(auditId);
    if (!audit) {
      return res.status(404).json({ message: "Audit not found" });
    }

    audit.status = "submitted";
    audit.submittedAt = new Date();
    await audit.save();

    return res.json({
      message: "Audit submitted successfully"
    });

  } catch (err) {
    console.error("❌ submitAudit failed:", err);
    return res.status(500).json({
      message: "Failed to submit audit",
      error: err.message
    });
  }
};

/* ======================================================
   4️⃣ CLOSE AUDIT
====================================================== */

export const closeAudit = async (req, res) => {
  try {
    const { auditId } = req.params;

    const audit = await Audit.findById(auditId);
    if (!audit) {
      return res.status(404).json({ message: "Audit not found" });
    }

    audit.status = "closed";
    audit.closedAt = new Date();
    await audit.save();

    return res.json({
      message: "Audit closed successfully"
    });

  } catch (err) {
    console.error("❌ closeAudit failed:", err);
    return res.status(500).json({
      message: "Failed to close audit",
      error: err.message
    });
  }
};

/* ======================================================
   5️⃣ GET AUDIT SUMMARY
====================================================== */

export const getAuditSummary = async (req, res) => {
  try {
    const { auditId } = req.params;

    const summary = await AuditAsset.aggregate([
      { $match: { auditId: new AuditAsset().auditId?.constructor(auditId) } },
      {
        $group: {
          _id: "$physicalStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      auditId,
      summary
    });

  } catch (err) {
    console.error("❌ getAuditSummary failed:", err);
    return res.status(500).json({
      message: "Failed to fetch audit summary",
      error: err.message
    });
  }
};
