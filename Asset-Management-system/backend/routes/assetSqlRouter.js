/**
 * @swagger
 * tags:
 *   name: SQL Assets
 *   description: Asset Management using MySQL database
 */

/**
 * @swagger
 * /api/sql/assets/add:
 *   post:
 *     summary: Add a new asset (MySQL)
 *     tags: [SQL Assets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - class
 *               - bus_A
 *               - cost_centre
 *               - sno
 *               - asset
 *             properties:
 *               class:
 *                 type: string
 *                 example: "3000"
 *               bus_A:
 *                 type: string
 *                 example: "2991"
 *               cost_centre:
 *                 type: string
 *                 example: "4300099"
 *               sno:
 *                 type: string
 *                 example: "300010"
 *               asset:
 *                 type: string
 *                 example: "DRILL M/C"
 *               asset_description:
 *                 type: string
 *                 example: "Horizontal Drill Machine"
 *               quantity:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: number
 *                 example: 8125.50
 *               dc_start:
 *                 type: string
 *                 format: date
 *                 example: "1953-04-01"
 *               depky:
 *                 type: string
 *                 example: "XI02"
 *               use_percentage:
 *                 type: string
 *                 example: "10"
 *               CostOrder:
 *                 type: string
 *                 example: "50020"
 *               planned_dep:
 *                 type: number
 *                 example: 900.44
 *               CoCd:
 *                 type: string
 *                 example: "1000"
 *               description:
 *                 type: string
 *                 example: "Services - Tool Room"
 *               business_area:
 *                 type: string
 *                 example: "General"
 *     responses:
 *       201:
 *         description: Asset added successfully
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/sql/assets/all:
 *   get:
 *     summary: Get all assets (MySQL)
 *     tags: [SQL Assets]
 *     responses:
 *       200:
 *         description: List of all assets
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/sql/assets/update/{id}:
 *   put:
 *     summary: Update an asset by ID (MySQL)
 *     tags: [SQL Assets]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Asset ID (MySQL)
 *         schema:
 *           type: integer
 *           example: 25
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               asset_description: "Updated Asset Name"
 *               quantity: 2
 *     responses:
 *       200:
 *         description: Asset updated successfully
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/sql/assets/delete/{id}:
 *   delete:
 *     summary: Delete an asset by ID (MySQL)
 *     tags: [SQL Assets]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Asset ID (MySQL)
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Asset deleted successfully
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Server error
 */
import express from "express";
import {
  addAsset,
  allAssets,
  updateAsset,
  deleteAsset,
  getPaginatedAssets
} from "../Controllers/assetSqlController.js";

const router = express.Router();

// Swagger here 👇 (paste above this)

// Routes
router.post("/add", addAsset);
router.get("/all", allAssets);
router.get("/paginated", getPaginatedAssets);
router.put("/update/:id", updateAsset);
router.delete("/delete/:id", deleteAsset);

export default router;
