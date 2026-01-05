import express from "express";
import { getAllRoles, getRoleById, createRole, updateRole, deleteRole } from "../Controllers/roleController.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";
import { requirePermission } from "../Middlewares/permissionMiddleware.js";

const roleRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management APIs
 */

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     description: Fetches all available roles in the system
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         description: Bearer token for authentication
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Successfully fetched all roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 65a123abc456def789012345
 *                       name:
 *                         type: string
 *                         example: admin
 *                       description:
 *                         type: string
 *                         example: Hospital Administrator
 *                       roleType:
 *                         type: string
 *                         enum: [system, organization, audit, employee]
 *                         example: organization
 *                       isSystemRole:
 *                         type: boolean
 *                         example: false
 *       401:
 *         description: Unauthorized – Missing or invalid Bearer token
 *       500:
 *         description: Internal server error
 */
roleRouter.get("/", authMiddleware, getAllRoles);


/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role (Requires user.assign_role permission)
 *     tags: [Roles]
 *     description: Creates a new role with specified permissions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - roleType
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name (unique)
 *               description:
 *                 type: string
 *                 description: Role description
 *               roleType:
 *                 type: string
 *                 enum: [system, organization, audit, employee]
 *               permissions:
 *                 type: object
 *                 description: Permission matrix
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Role already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *       500:
 *         description: Internal server error
 */
roleRouter.post("/", authMiddleware, requirePermission("user", "assign_role"), createRole);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [Roles]
 *     description: Fetches a specific role by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Successfully fetched role
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
roleRouter.get("/:id", authMiddleware, getRoleById);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update a role (Requires user.assign_role permission)
 *     tags: [Roles]
 *     description: Updates an existing role (system roles cannot be modified)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               roleType:
 *                 type: string
 *                 enum: [system, organization, audit, employee]
 *               permissions:
 *                 type: object
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Cannot modify system roles or insufficient permissions
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
roleRouter.put("/:id", authMiddleware, requirePermission("user", "assign_role"), updateRole);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete a role (Requires user.assign_role permission)
 *     tags: [Roles]
 *     description: Deletes a role (system roles cannot be deleted)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       403:
 *         description: Cannot delete system roles or insufficient permissions
 *       404:
 *         description: Role not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
roleRouter.delete("/:id", authMiddleware, requirePermission("user", "assign_role"), deleteRole);

export default roleRouter;
