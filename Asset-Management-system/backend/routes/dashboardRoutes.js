import express from "express";
import { getDashboardSummary, assetsByDepartment, utilizationByDepartment, costTrends, dashboardAlerts, getHospitalsByEntity } from "../Controllers/dashboardController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics (summary, charts, alerts) - MongoDB only
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Dashboard summary counts from MongoDB
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional hospital scope (MongoDB ObjectId). If provided, returns data for specific hospital. If omitted, returns global data from all hospitals.
 *       - in: query
 *         name: debug
 *         schema:
 *           type: string
 *           enum: ["1"]
 *         required: false
 *         description: If set to 1, returns debug info with scope and total counts.
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
 *                     scope:
 *                       type: string
 *                       enum: ["hospital", "global"]
 *                     hospitalInfo:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         entityCode:
 *                           type: string
 *                         location:
 *                           type: string
 *                 - type: object
 *                   properties:
 *                     debug:
 *                       type: boolean
 *                     hospitalId:
 *                       type: string
 *                     mongoScope:
 *                       type: object
 *                     mongoTotal:
 *                       type: number
 */

router.get("/summary", getDashboardSummary);

/**
 * @swagger
 * /api/dashboard/assets-by-department:
 *   get:
 *     summary: Asset distribution by department from MongoDB
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional hospital scope (MongoDB ObjectId). If provided, returns data for specific hospital. If omitted, returns global data from all hospitals.
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
 *     summary: Utilization percentage by department from MongoDB
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional hospital scope (MongoDB ObjectId). If provided, returns data for specific hospital. If omitted, returns global data from all hospitals.
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
 *     summary: Monthly purchase cost and maintenance cost from MongoDB
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional hospital scope (MongoDB ObjectId). If provided, returns data for specific hospital. If omitted, returns global data from all hospitals.
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
 *     summary: Maintenance and AMC alerts from MongoDB
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: hospitalId
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional hospital scope (MongoDB ObjectId). If provided, returns data for specific hospital. If omitted, returns global data from all hospitals.
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

/**
 * @swagger
 * /api/dashboard/hospitals:
 *   get:
 *     summary: Get hospital count and list with optional entity filtering
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: entityCode
 *         schema:
 *           type: string
 *           example: "ENT-001"
 *         description: Entity code to filter hospitals (optional - returns all hospitals if not provided)
 *     responses:
 *       200:
 *         description: Hospital data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 5
 *                 scope:
 *                   type: string
 *                   enum: [global, entity]
 *                   example: "entity"
 *                 entityCode:
 *                   type: string
 *                   nullable: true
 *                   example: "ENT-001"
 *                 entityName:
 *                   type: string
 *                   nullable: true
 *                   example: "North Region Entity"
 *                 hospitals:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "695e018e5fc76accde6ca603"
 *                       hospitalId:
 *                         type: string
 *                         example: "HOSP-0001"
 *                       name:
 *                         type: string
 *                         example: "City General Hospital"
 *                       location:
 *                         type: string
 *                         example: "New York"
 *                       contactEmail:
 *                         type: string
 *                         example: "contact@hospital.com"
 *       404:
 *         description: Entity not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Entity not found"
 */
router.get("/hospitals", getHospitalsByEntity);

export default router;
