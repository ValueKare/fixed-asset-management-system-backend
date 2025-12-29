/**
 * @swagger
 * tags:
 *   name: Scrap
 *   description: Scrap Policy Management
 */

import express from "express";
import {
  createScrapRequest,
  getAllScrapRequests,
  approveScrapRequest,
  rejectScrapRequest
} from "../controllers/scrapController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { requireRole } from "../middlewares/roleMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/scrap:
 *   post:
 *     summary: Create a scrap request for an asset
 *     tags: [Scrap]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetId
 *               - reason
 *             properties:
 *               assetId:
 *                 type: string
 *                 example: 665f1b2e8c8a4f0012abcd34
 *               reason:
 *                 type: string
 *                 example: Asset is beyond repair
 *     responses:
 *       201:
 *         description: Scrap request created successfully
 *       400:
 *         description: Asset already scrapped
 *       404:
 *         description: Asset not found
 */
router.post(
  "/",
  protect,
  requireRole("admin", "inventory"),
  createScrapRequest
);

/**
 * @swagger
 * /api/scrap:
 *   get:
 *     summary: Get all scrap requests
 *     tags: [Scrap]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of scrap requests
 */
router.get(
  "/",
  protect,
  requireRole("admin"),
  getAllScrapRequests
);

/**
 * @swagger
 * /api/scrap/{id}/approve:
 *   put:
 *     summary: Approve a scrap request
 *     tags: [Scrap]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 665f2a9a8c8a4f0012abcd56
 *     responses:
 *       200:
 *         description: Scrap request approved
 *       404:
 *         description: Request not found
 */
router.put(
  "/:id/approve",
  protect,
  requireRole("admin"),
  approveScrapRequest
);

/**
 * @swagger
 * /api/scrap/{id}/reject:
 *   put:
 *     summary: Reject a scrap request
 *     tags: [Scrap]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 665f2a9a8c8a4f0012abcd56
 *     responses:
 *       200:
 *         description: Scrap request rejected
 *       404:
 *         description: Request not found
 */
router.put(
  "/:id/reject",
  protect,
  requireRole("admin"),
  rejectScrapRequest
);

export default router;
