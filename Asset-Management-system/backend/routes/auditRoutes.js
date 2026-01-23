import express from "express";
import {
  initiateAudit,
  verifyAuditAsset,
  submitAudit,
  closeAudit,
  getAuditSummary,
  getAuditAssets,
  getAuditAssetForVerification,
  getAllAudits
} from "../Controllers/auditController.js";

import { authMiddleware } from "../Middlewares/authMiddleware.js";
import requirePermission from "../Middlewares/PermissionMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Audit
 *   description: Audit lifecycle management APIs for Fixed Asset Management
 */

/* ======================================================
   GET ALL AUDITS
====================================================== */
/**
 * @swagger
 * /api/audit:
 *   get:
 *     summary: Get all audits with filtering and pagination
 *     description: Returns paginated list of audits with statistics and filtering options.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planned, in_progress, submitted, closed, all]
 *           default: all
 *         description: Filter by audit status
 *       - in: query
 *         name: auditType
 *         schema:
 *           type: string
 *           enum: [statutory, internal, physical, surprise, all]
 *           default: all
 *         description: Filter by audit type
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         description: Filter by hospital ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by audit code or type
 *     responses:
 *       200:
 *         description: Audits fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  authMiddleware,
  requirePermission("audit", "verify"),
  getAllAudits
);

/* ======================================================
   INITIATE AUDIT
====================================================== */
/**
 * @swagger
 * /api/audit/initiate:
 *   post:
 *     summary: Initiate a new audit
 *     description: Creates a new audit cycle and assigns all hospital assets for verification.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - auditCode
 *               - hospitalId
 *               - auditType
 *             properties:
 *               auditCode:
 *                 type: string
 *                 example: AUD-2025-001
 *               hospitalId:
 *                 type: string
 *                 example: 65f0c9b2e1a1c23abcd12345
 *               auditType:
 *                 type: string
 *                 enum: [statutory, internal, physical, surprise]
 *               periodFrom:
 *                 type: string
 *                 format: date
 *               periodTo:
 *                 type: string
 *                 format: date
 *               assignedAuditors:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Audit initiated successfully
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 */
router.post(
  "/initiate",
  authMiddleware,
  requirePermission("audit", "initiate"),
  initiateAudit
);

/* ======================================================
   VERIFY ASSET DURING AUDIT
====================================================== */
/**
 * @swagger
 * /api/audit/verify/{auditId}/{assetKey}:
 *   put:
 *     summary: Verify an asset during audit
 *     description: Records physical verification result for an asset under an audit.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auditId
 *         required: true
 *         schema:
 *           type: string
 *         description: Audit ID
 *       - in: path
 *         name: assetKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - physicalStatus
 *             properties:
 *               physicalStatus:
 *                 type: string
 *                 enum: [found, not_found, damaged, excess]
 *               auditorRemark:
 *                 type: string
 *                 example: Screen cracked
 *               locationMatched:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Asset verified successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Audit asset not found
 *       500:
 *         description: Server error
 */
router.put(
  "/verify/:auditId/:assetKey",
  authMiddleware,
  requirePermission("audit", "verify"),
  verifyAuditAsset
);

/* ======================================================
   GET AUDIT ASSETS FOR VERIFICATION
====================================================== */
/**
 * @swagger
 * /api/audit/{auditId}/assets:
 *   get:
 *     summary: Get all assets for an audit with complete details
 *     description: Returns paginated list of assets assigned to an audit with complete asset details for verification.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auditId
 *         required: true
 *         schema:
 *           type: string
 *         description: Audit ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [found, not_found, damaged, excess, all]
 *           default: all
 *         description: Filter by verification status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by asset key
 *     responses:
 *       200:
 *         description: Audit assets fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Audit not found
 *       500:
 *         description: Server error
 */
router.get(
  "/:auditId/assets",
  authMiddleware,
  requirePermission("audit", "verify"),
  getAuditAssets
);

/* ======================================================
   GET SINGLE AUDIT ASSET FOR VERIFICATION
====================================================== */
/**
 * @swagger
 * /api/audit/{auditId}/assets/{assetKey}:
 *   get:
 *     summary: Get detailed asset information for verification
 *     description: Returns complete asset details with audit information and verification history.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auditId
 *         required: true
 *         schema:
 *           type: string
 *         description: Audit ID
 *       - in: path
 *         name: assetKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset key
 *     responses:
 *       200:
 *         description: Asset verification details fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Audit asset not found
 *       500:
 *         description: Server error
 */
router.get(
  "/:auditId/assets/:assetKey",
  authMiddleware,
  requirePermission("audit", "verify"),
  getAuditAssetForVerification
);

/* ======================================================
   SUBMIT AUDIT
====================================================== */
/**
 * @swagger
 * /api/audit/submit/{auditId}:
 *   put:
 *     summary: Submit an audit
 *     description: Marks an audit as submitted after verification is complete.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auditId
 *         required: true
 *         schema:
 *           type: string
 *         description: Audit ID
 *     responses:
 *       200:
 *         description: Audit submitted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Audit not found
 *       500:
 *         description: Server error
 */
router.put(
  "/submit/:auditId",
  authMiddleware,
  requirePermission("audit", "submit"),
  submitAudit
);

/* ======================================================
   CLOSE AUDIT
====================================================== */
/**
 * @swagger
 * /api/audit/close/{auditId}:
 *   put:
 *     summary: Close an audit
 *     description: Closes the audit cycle and finalizes audit records.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auditId
 *         required: true
 *         schema:
 *           type: string
 *         description: Audit ID
 *     responses:
 *       200:
 *         description: Audit closed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Audit not found
 *       500:
 *         description: Server error
 */
router.put(
  "/close/:auditId",
  authMiddleware,
  requirePermission("audit", "close"),
  closeAudit
);

/* ======================================================
   AUDIT SUMMARY
====================================================== */
/**
 * @swagger
 * /api/audit/summary/{auditId}:
 *   get:
 *     summary: Get audit summary
 *     description: Returns summary counts of asset verification statuses for an audit.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: auditId
 *         required: true
 *         schema:
 *           type: string
 *         description: Audit ID
 *     responses:
 *       200:
 *         description: Audit summary fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Audit not found
 *       500:
 *         description: Server error
 */
router.get(
  "/summary/:auditId",
  authMiddleware,
  requirePermission("audit", "verify"),
  getAuditSummary
);

export default router;
