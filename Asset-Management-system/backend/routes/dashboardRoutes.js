import express from "express";
import {
  getDashboardSummary,
  assetsByDepartment,
  utilizationByDepartment,
  costTrends,
  dashboardAlerts
} from "../Controllers/dashboardController.js";

import { protect } from "../Middlewares/authMiddleware.js";
import { requirePermission } from "../Middlewares/PermissionMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics and summary APIs
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary
 *     description: Returns high-level dashboard statistics for the dashboard cards.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard summary fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAssets:
 *                   type: integer
 *                   example: 1200
 *                 activeAssets:
 *                   type: integer
 *                   example: 980
 *                 underMaintenance:
 *                   type: integer
 *                   example: 150
 *                 scrappedAssets:
 *                   type: integer
 *                   example: 70
 *       500:
 *         description: Server error
 */
router.get("/summary", getDashboardSummary);

/**
 * @swagger
 * /api/dashboard/assets-by-department:
 *   get:
 *     summary: Get asset count grouped by department
 *     description: Returns department-wise asset distribution for dashboard charts.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Assets grouped by department fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   department:
 *                     type: string
 *                     example: Radiology
 *                   assetCount:
 *                     type: integer
 *                     example: 120
 *       500:
 *         description: Server error
 */
router.get("/assets-by-department", assetsByDepartment);

router.get(
  "/utilization",
  utilizationByDepartment
);

router.get(
  "/cost-trends",
  costTrends
);

router.get(
  "/alerts",
  dashboardAlerts
);

export default router;
