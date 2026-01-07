import express from "express";
import {
  getDashboardSummary,
  assetsByDepartment,
  utilizationByDepartment,
  costTrends,
  dashboardAlerts
} from "../Controllers/dashboardController.js";

const router = express.Router();

router.get("/summary", getDashboardSummary);
router.get("/assets-by-department", assetsByDepartment);
router.get("/utilization", utilizationByDepartment);
router.get("/cost-trends", costTrends);
router.get("/alerts", dashboardAlerts);

export default router;

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Dashboard summary counts
 *     responses:
 *       200:
 *         description: Summary metrics
 */

/**
 * @swagger
 * /api/dashboard/assets-by-department:
 *   get:
 *     summary: Asset distribution by department
 */

/**
 * @swagger
 * /api/dashboard/utilization:
 *   get:
 *     summary: Department utilization percentage
 */

/**
 * @swagger
 * /api/dashboard/cost-trends:
 *   get:
 *     summary: Monthly cost vs maintenance
 */

/**
 * @swagger
 * /api/dashboard/alerts:
 *   get:
 *     summary: Maintenance and AMC alerts
 */
