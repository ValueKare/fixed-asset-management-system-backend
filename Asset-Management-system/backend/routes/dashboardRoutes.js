import express from "express";
import {
  getDashboardSummary,
  assetsByDepartment,
  utilizationByDepartment,
  costTrends,
  dashboardAlerts
} from "../Controllers/dashboardController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics (summary, charts, alerts)
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Dashboard summary counts
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional hospital scope (MongoDB ObjectId). Ignored for MySQL fallback.
 *       - in: query
 *         name: debug
 *         schema:
 *           type: string
 *           enum: ["1"]
 *         required: false
 *         description: If set to 1, returns debug info (mongo/mysql counts) instead of summary metrics.
 *     responses:
 *       200:
 *         description: Summary metrics or debug payload
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     totalAssets:
 *                       type: number
 *                     activeAssets:
 *                       type: number
 *                     underMaintenance:
 *                       type: number
 *                     scrappedAssets:
 *                       type: number
 *                     amcDue:
 *                       type: number
 *                     utilizationRate:
 *                       type: number
 *                 - type: object
 *                   properties:
 *                     debug:
 *                       type: boolean
 *                     mongoTotalScoped:
 *                       type: number
 *                     mysqlTotal:
 *                       type: number
 */

router.get("/summary", getDashboardSummary);

/**
 * @swagger
 * /api/dashboard/assets-by-department:
 *   get:
 *     summary: Asset distribution by department
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional hospital scope (MongoDB ObjectId). Ignored for MySQL fallback.
 *     responses:
 *       200:
 *         description: Pie chart data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   department:
 *                     type: string
 *                   assetCount:
 *                     type: number
 */
router.get("/assets-by-department", assetsByDepartment);

/**
 * @swagger
 * /api/dashboard/utilization:
 *   get:
 *     summary: Utilization percentage by department
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional hospital scope (MongoDB ObjectId). Ignored for MySQL fallback.
 *     responses:
 *       200:
 *         description: Bar chart data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   department:
 *                     type: string
 *                   utilization:
 *                     type: number
 */
router.get("/utilization", utilizationByDepartment);

/**
 * @swagger
 * /api/dashboard/cost-trends:
 *   get:
 *     summary: Monthly purchase cost and maintenance cost
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional hospital scope (MongoDB ObjectId). Ignored for MySQL fallback.
 *     responses:
 *       200:
 *         description: Line chart data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   month:
 *                     type: number
 *                   cost:
 *                     type: number
 *                   maintenance:
 *                     type: number
 */
router.get("/cost-trends", costTrends);

/**
 * @swagger
 * /api/dashboard/alerts:
 *   get:
 *     summary: Maintenance and AMC alerts
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional hospital scope (MongoDB ObjectId). Ignored for MySQL fallback.
 *     responses:
 *       200:
 *         description: List of alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   assetName:
 *                     type: string
 *                   department:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     nullable: true
 */
router.get("/alerts", dashboardAlerts);

export default router;
