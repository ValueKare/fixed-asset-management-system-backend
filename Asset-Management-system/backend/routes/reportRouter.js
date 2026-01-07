import express from "express";
import {
  getAuditReport,
  getDepartmentSummary,
  getAssetUsageReport,
  getRequestsSummary,
} from "../Controllers/reportController.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";
import { isAdmin, isHOD, isCFO } from "../Middlewares/roleMiddleware.js";

const reportRouter = express.Router();


/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Audit, summaries and analytics
 */

/**
 * @swagger
 * /api/reports/audit:
 *   get:
 *     summary: Generate full audit log report (admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit log data
 */
reportRouter.get("/audit", authMiddleware, isAdmin, getAuditReport);

/**
 * @swagger
 * /api/reports/department:
 *   get:
 *     summary: Get department-level request summary (HOD)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Department name (optional)
 *     responses:
 *       200:
 *         description: Department summary
 */
reportRouter.get("/department", authMiddleware, isHOD, getDepartmentSummary);

/**
 * @swagger
 * /api/reports/assets:
 *   get:
 *     summary: Asset usage and inventory statistics (admin)
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asset usage data
 */
reportRouter.get("/assets", authMiddleware, isAdmin, getAssetUsageReport);

/**
 * @swagger
 * /api/reports/requests-summary:
 *   get:
 *     summary: Get summary of requests by status/category
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by request status (optional)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by asset category (optional)
 *     responses:
 *       200:
 *         description: Summary object
 */
reportRouter.get("/requests-summary", authMiddleware, isAdmin, getRequestsSummary);

export default reportRouter;
