// backend/utils/auditLogger.js

import AuditLog from "../Models/Auditlog.js";

/**
 * Generic audit logger
 * This should be used internally by other helper functions
 */
const logAction = async ({
  action,
  userId,
  userRole,
  entityType,
  entityId,
  hospitalId,
  organizationId,
  details,
  meta = {},
  ipAddress
}) => {
  try {
    await AuditLog.create({
      action,
      userId,
      userRole,
      entityType,
      entityId,
      hospitalId,
      organizationId,
      details,
      meta,
      ipAddress
    });
  } catch (err) {
    // IMPORTANT: audit logging should NEVER crash main flow
    console.error("⚠️ AuditLog failed:", err.message);
  }
};

/* ======================================================
   🔹 AUDIT CONTROLLER LOGS
====================================================== */

/**
 * Log when an audit is started
 */
export const logAuditStarted = async (req, audit) => {
  await logAction({
    action: "AUDIT_STARTED",
    userId: req.user._id,
    userRole: req.user.role,
    entityType: "Audit",
    entityId: audit._id,
    hospitalId: audit.hospitalId,
    organizationId: req.user.organizationId,
    details: `Audit ${audit.auditCode} initiated`,
    ipAddress: req.ip
  });
};

/**
 * Log when an asset is verified during audit
 */
export const logAuditAssetVerified = async ({
  auditorId,
  hospitalId,
  auditAsset,
  assetKey,
  physicalStatus,
  remark
}) => {
  await logAction({
    action: "AUDIT_ASSET_VERIFIED",
    userId: auditorId,
    userRole: "audit_admin",
    entityType: "AuditAsset",
    entityId: auditAsset._id,
    hospitalId,
    details: `Asset ${assetKey} verified as ${physicalStatus}`,
    meta: {
      assetKey,
      physicalStatus,
      remark
    }
  });
};

/* ======================================================
   🔹 ASSET & UPLOAD LOGS
====================================================== */

/**
 * Log CSV / bulk asset upload
 */
export const logAssetBulkUpload = async (req, { inserted, total, hospitalId }) => {
  await logAction({
    action: "ASSET_BULK_UPLOAD",
    userId: req.user._id,
    userRole: req.user.role,
    entityType: "Asset",
    entityId: null,
    hospitalId,
    organizationId: req.user.organizationId,
    details: `Uploaded ${inserted}/${total} assets via CSV`,
    meta: {
      inserted,
      total,
      fileName: req.file?.originalname
    },
    ipAddress: req.ip
  });
};

/* ======================================================
   🔹 EXPORT GENERIC LOGGER (OPTIONAL)
====================================================== */

export { logAction };
