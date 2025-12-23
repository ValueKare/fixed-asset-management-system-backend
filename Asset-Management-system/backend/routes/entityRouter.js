// backend/routes/entityRouter.js
import express from "express";
import {
  createEntity,
  getAllEntities,
  getEntityById,
  updateEntity,
  deleteEntity,
} from "../Controllers/entityController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Entity
 *   description: Master data for hospital entities (hospitals/locations)
 */

/**
 * @swagger
 * /api/entity:
 *   post:
 *     summary: Create a new Entity (hospital / center)
 *     tags: [Entity]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entity created
 */
router.post("/", createEntity);

/**
 * @swagger
 * /api/entity:
 *   get:
 *     summary: Get all entities
 *     tags: [Entity]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *         description: Filter by active status (true/false)
 *     responses:
 *       200:
 *         description: List of entities
 */
router.get("/", getAllEntities);

/**
 * @swagger
 * /api/entity/{id}:
 *   get:
 *     summary: Get entity by id
 *     tags: [Entity]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Single entity
 */
router.get("/:id", getEntityById);

/**
 * @swagger
 * /api/entity/{id}:
 *   put:
 *     summary: Update an entity
 *     tags: [Entity]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated entity
 */
router.put("/:id", updateEntity);

/**
 * @swagger
 * /api/entity/{id}:
 *   delete:
 *     summary: Deactivate (soft delete) an entity
 *     tags: [Entity]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entity deactivated
 */
router.delete("/:id", deleteEntity);

export default router;
