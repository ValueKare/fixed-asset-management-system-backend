// backend/routes/requestRouter.js
import express from "express";
import { protect } from "../Middlewares/authMiddleware.js";
import { requireRole } from "../Middlewares/roleMiddleware.js";

import {
  createRequest,
  getMyRequests,
  getRequestById,
  getPendingForMe,
  approveRequest,
  rejectRequest,
  getAllRequests,
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
  createRequest
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

export default router;
