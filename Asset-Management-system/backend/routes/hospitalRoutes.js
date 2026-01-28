import express from "express";
import { createHospital, getHospitals ,updateHospital} from "../Controllers/hospitalController.js";
import { authMiddleware, protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";
import requirePermission from "../Middlewares/PermissionMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Hospital:
 *       type: object
 *       required:
 *         - name
 *         - entityId
 *         - location
 *         - contactEmail
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the hospital
 *         name:
 *           type: string
 *           description: The name of the hospital
 *         entityId:
 *           type: string
 *           description: The entity ID associated with the hospital
 *         location:
 *           type: string
 *           description: The location of the hospital
 *         contactEmail:
 *           type: string
 *           description: The contact email of the hospital
 *         phone:
 *           type: string
 *           description: The phone number of the hospital
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the hospital was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the hospital was last updated
 *       example:
 *         _id: 64f1a2b3c4d5e6f7g8h9i0j1
 *         name: General Hospital
 *         entityId: 64f1a2b3c4d5e6f7g8h9i0j2
 *         location: New York, NY
 *         contactEmail: info@generalhospital.com
 *         phone: +1-555-0123
 *         createdAt: 2023-09-01T10:00:00.000Z
 *         updatedAt: 2023-09-01T10:00:00.000Z
 */

/**
 * @swagger
 * /api/hospital:
 *   post:
 *     summary: Create a new hospital
 *     description: Create a new hospital with the provided details. Only superadmin can create hospitals.
 *     tags: [Hospitals]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - entityId
 *               - location
 *               - contactEmail
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the hospital
 *               entityId:
 *                 type: string
 *                 description: The entity ID associated with the hospital
 *               location:
 *                 type: string
 *                 description: The location of the hospital
 *               contactEmail:
 *                 type: string
 *                 description: The contact email of the hospital
 *               phone:
 *                 type: string
 *                 description: The phone number of the hospital
 *             example:
 *               name: General Hospital
 *               entityId: 64f1a2b3c4d5e6f7g8h9i0j2
 *               location: New York, NY
 *               contactEmail: info@generalhospital.com
 *               phone: +1-555-0123
 *     responses:
 *       201:
 *         description: Hospital created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 hospital:
 *                   $ref: '#/components/schemas/Hospital'
 *       400:
 *         description: Bad request - validation error or hospital already exists
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
 *                   example: Hospital with this name already exists
 *       401:
 *         description: Unauthorized - user not authenticated
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
 *                   example: Not authorized, token failed
 *       403:
 *         description: Forbidden - user not authorized to create hospitals
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
 *                   example: Not authorized as superadmin
 */
router.post("/", authMiddleware, requirePermission("user","assign_role"), createHospital);
// roleRouter.post("/", authMiddleware, requirePermission("user", "assign_role"), createRole);
/**
 * @swagger
 * /api/hospital:
 *   get:
 *     summary: Get all hospitals
 *     description: Retrieve a list of all hospitals. Only superadmin and auditmanager can access this endpoint.
 *     tags: [Hospitals]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of hospitals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hospital'
 *       401:
 *         description: Unauthorized - user not authenticated
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
 *                   example: Not authorized, token failed
 *       403:
 *         description: Forbidden - user not authorized to view hospitals
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
 *                   example: Not authorized as superadmin or auditmanager
 */
router.get("/", authMiddleware, requirePermission("user","assign_role"),getHospitals);
/**
 * @swagger
 * /api/hospitals:
 *   get:
 *     summary: Get all hospitals
 *     description: Fetches a list of all hospitals available in the system. Used for role assignment and hospital mapping.
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hospitals fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: 65f0c9b2e1a1c23abcd12345
 *                   name:
 *                     type: string
 *                     example: City General Hospital
 *                   code:
 *                     type: string
 *                     example: CGH-001
 *       401:
 *         description: Unauthorized – invalid or missing token
 *       403:
 *         description: Permission denied
 *       500:
 *         description: Server error
 */

router.put("/:hospitalId", authMiddleware, requirePermission("user","assign_role"),updateHospital);
/**
 * @swagger
 * /api/hospitals/{hospitalId}:
 *   put:
 *     summary: Update hospital details
 *     description: Updates hospital information such as name, code, or status. Restricted to users with role assignment permissions.
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hospitalId
 *         required: true
 *         schema:
 *           type: string
 *         description: Hospital ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: City General Hospital
 *               code:
 *                 type: string
 *                 example: CGH-001
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Hospital updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Permission denied
 *       404:
 *         description: Hospital not found
 *       500:
 *         description: Server error
 */


export default router;

