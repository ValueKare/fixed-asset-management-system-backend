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
  getDepartmentAssets,
  updateAssetUtilizationStatus,
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
  requirePermission("asset","transfer"),
  createRequest
);

router.get(
  "/open",
  authMiddleware,
  requirePermission("asset","transfer"),
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
  requirePermission("asset","transfer"),
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
  requirePermission("asset","transfer"),
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
  requirePermission("asset","transfer"),
  createSpecificAssetRequest
);

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

/**
 * @swagger
 * /api/requests/assets/department:
 *   get:
 *     summary: Get assets for user's department
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Assets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get("/assets/department", authMiddleware,requirePermission("asset","transfer"), getDepartmentAssets);

/**
 * @swagger
 * /api/requests/assets/{assetId}/utilization:
 *   put:
 *     summary: Update asset utilization status
 *     tags: [Requests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - utilizationStatus
 *             properties:
 *               utilizationStatus:
 *                 type: string
 *                 enum: [in_use, not_in_use, under_maintenance]
 *                 description: New utilization status
 *     responses:
 *       200:
 *         description: Asset status updated successfully
 *       400:
 *         description: Invalid utilization status
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Server error
 */
router.put("/assets/:assetId/utilization", authMiddleware, requirePermission("asset","transfer"),updateAssetUtilizationStatus);

export default router;
