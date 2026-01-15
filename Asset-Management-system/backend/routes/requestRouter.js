// backend/routes/requestRouter.js
import express from "express";
import { authMiddleware, protect } from "../Middlewares/authMiddleware.js";
import { requireRole } from "../Middlewares/roleMiddleware.js";
import { requirePermission } from "../Middlewares/PermissionMiddleware.js";
import {
  createRequest,
  getMyRequests,
  getRequestById,
  getPendingForMe,
  approveRequest,
  rejectRequest,
  rejectRequestAssets,
  getAllRequests,
  getOpenRequests,
  getDepartmentsWithAssets,
  getDepartmentIdealAssets,
  createSpecificAssetRequest,
  fulfillAssetRequest,
} from "../Controllers/requestController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Requests
 *   description: Asset request workflow (Level1 → CFO)
 */

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a new request
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetCategory
 *               - assetName
 *               - quantity
 *               - department
 *               - justification
 *             properties:
 *               assetCategory:
 *                 type: string
 *               assetName:
 *                 type: string
 *               quantity:
 *                 type: number
 *               department:
 *                 type: string
 *               justification:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *     responses:
 *       201:
 *         description: Request created successfully
 *       400:
 *         description: Missing required fields
 */
router.post(
  "/",
  authMiddleware,
  requirePermission("user","assign_role"),
  createRequest
);

router.get(
  "/open",
  authMiddleware,
  requirePermission("user","assign_role"),
  getOpenRequests
);

/**
 * @swagger
 * /api/requests/departments-with-assets:
 *   get:
 *     summary: Get departments with available assets
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Departments with asset counts
 *       500:
 *         description: Server error
 */
router.get(
  "/departments-with-assets",
  authMiddleware,
  requirePermission("user","assign_role"),
  getDepartmentsWithAssets
);

/**
 * @swagger
 * /api/requests/departments/{departmentId}/assets:
 *   get:
 *     summary: Get ideal assets for a specific department
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID
 *     responses:
 *       200:
 *         description: List of available assets
 *       500:
 *         description: Server error
 */
router.get(
  "/departments/:departmentId/assets",
  authMiddleware,
  requirePermission("user","assign_role"),
  getDepartmentIdealAssets
);

/**
 * @swagger
 * /api/requests/specific-assets:
 *   post:
 *     summary: Create request for specific assets
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestType:
 *                 type: string
 *                 enum: ["asset_transfer", "procurement", "scrap", "scrap_reversal"]
 *               assetCategory:
 *                 type: string
 *               assetName:
 *                 type: string
 *               requestedAssets:
 *                 type: array
 *                 items:
 *                   type: string
 *               justification:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: ["low", "medium", "high", "urgent"]
 *                 default: "medium"
 *     responses:
 *       201:
 *         description: Request created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Assets no longer available
 *       500:
 *         description: Server error
 */
router.post(
  "/specific-assets",
  authMiddleware,
  requirePermission("user","assign_role"),
  createSpecificAssetRequest
);
/**
 * @swagger
 * /api/requests/my:
 *   get:
 *     summary: Get logged-in user's requests
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of user's requests
 */
router.get("/my", protect, getMyRequests);

/**
 * @swagger
 * /api/requests/pending:
 *   get:
 *     summary: Get pending requests for current approver
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of pending requests for approver
 *       403:
 *         description: User not part of approval workflow
 */
router.get(
  "/pending",
  protect,
  requireRole(
    "level1",
    "level2",
    "level3",
    "hod",
    "inventory",
    "purchase",
    "budget",
    "cfo",
    "admin"
  ),
  getPendingForMe
);

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Get full request details including approval timeline
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Request details
 *       404:
 *         description: Request not found
 */
router.get("/:id", protect, getRequestById);

/**
 * @swagger
 * /api/requests/{id}/approve:
 *   post:
 *     summary: Approve request at current workflow level
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Request ID
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request approved successfully
 *       403:
 *         description: User not authorized to approve this level
 *       404:
 *         description: Request not found
 */
router.post(
  "/:id/approve",
  protect,
  requireRole(
    "level1",
    "level2",
    "level3",
    "hod",
    "inventory",
    "purchase",
    "budget",
    "cfo",
    "admin"
  ),
  approveRequest
);

/**
 * @swagger
 * /api/requests/{id}/reject:
 *   post:
 *     summary: Reject request at current level
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Request ID
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Request rejected
 *       403:
 *         description: Unauthorized rejection
 *       404:
 *         description: Request not found
 */
router.post(
  "/:id/reject",
  protect,
  requireRole(
    "level1",
    "level2",
    "level3",
    "hod",
    "inventory",
    "purchase",
    "budget",
    "cfo",
    "admin"
  ),
  rejectRequest
);

/**
 * @swagger
 * /api/requests/admin/all:
 *   get:
 *     summary: Get all requests (Admin only)
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: All requests
 *       403:
 *         description: Admin only access
 */
router.get("/admin/all", protect, requireRole("admin"), getAllRequests);

/**
 * @swagger
 * /api/requests/{requestId}/fulfill:
 *   post:
 *     summary: Fulfill an asset request with specific assets
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetIds
 *             properties:
 *               assetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of asset IDs to fulfill the request
 *               remarks:
 *                 type: string
 *                 description: Optional remarks
 *     responses:
 *       200:
 *         description: Assets fulfilled successfully
 *       400:
 *         description: Bad request or invalid request
 *       403:
 *         description: Cross-hospital access denied
 *       409:
 *         description: Asset conflict detected
 *       500:
 *         description: Server error
 */
router.post(
  "/:requestId/fulfill",
  authMiddleware,
  requirePermission("asset","transfer"),
  fulfillAssetRequest
);

/**
 * @swagger
 * /api/requests/{requestId}/reject-assets:
 *   post:
 *     summary: Reject specific assets within a request
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetIds
 *             properties:
 *               assetIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of asset IDs to reject
 *               remarks:
 *                 type: string
 *                 description: Optional rejection remarks
 *     responses:
 *       200:
 *         description: Assets rejected successfully
 *       400:
 *         description: Bad request or no assets specified
 *       403:
 *         description: Cross-hospital access denied
 *       404:
 *         description: Request not found or already closed
 *       500:
 *         description: Server error
 */
router.post(
  "/:requestId/reject-assets",
  authMiddleware,
  requirePermission("asset","transfer"),
  rejectRequestAssets
);

export default router;
