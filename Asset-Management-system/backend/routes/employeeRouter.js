import express from "express"
import { adminVerify } from "../Middlewares/adminVerify.js"
import { addEmployee, getAllEmployees, getEmployee } from "../Controllers/employeeController.js"
import { authMiddleware } from "../Middlewares/authMiddleware.js"
import requirePermission from "../Middlewares/PermissionMiddleware.js"

const employeeRouter=express.Router()

/**
 * @swagger
 * /api/employee/add:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employee]
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
 *               - email
 *               - organizationId
 *               - hospital
 *               - department
 *               - roleId
 *               - panel
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *                 description: "Full name of employee"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@hospital.com"
 *                 description: "Email address (must be unique)"
 *               organizationId:
 *                 type: string
 *                 example: "ORG001"
 *                 description: "Organization identifier"
 *               hospital:
 *                 type: string
 *                 example: "507f1f2a1234567890abcdef"
 *                 description: "MongoDB ObjectId of the hospital"
 *               department:
 *                 type: string
 *                 example: "507f1f2d1234567890abcdef"
 *                 description: "MongoDB ObjectId of department"
 *               ward:
 *                 type: string
 *                 example: "Ward A"
 *                 description: "Ward assignment"
 *               role:
 *                 type: string
 *                 example: "doctor"
 *                 description: "Employee role (admin, hod, inventory, purchase, cfo)"
 *               roleId:
 *                 type: string
 *                 example: "507f1f2b1234567890abcdef"
 *                 description: "MongoDB ObjectId of the role"
 *               panel:
 *                 type: string
 *                 example: "doctor"
 *                 description: "Employee panel (doctor, nurse, technician, staff)"
 *               parentUserId:
 *                 type: string
 *                 example: "EMP000"
 *                 description: "Parent user ID for reporting hierarchy"
 *               permissions:
 *                 type: object
 *                 example: {"asset.create": true, "asset.read": true}
 *                 description: "Fine-grained permissions object"
 *               joinedDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-15"
 *                 description: "Date when employee joined the organization"
 *               contactNumber:
 *                 type: string
 *                 example: "+1234567890"
 *                 description: "Contact phone number"
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Employee added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f2c1234567890abcdef"
 *                     empId:
 *                       type: string
 *                       example: "EMP001"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john.doe@hospital.com"
 *                     organizationId:
 *                       type: string
 *                       example: "ORG001"
 *                     hospital:
 *                       type: string
 *                       example: "507f1f2a1234567890abcdef"
 *                     role:
 *                       type: string
 *                       example: "doctor"
 *                     roleId:
 *                       type: string
 *                       example: "507f1f2b1234567890abcdef"
 *                     panel:
 *                       type: string
 *                       example: "doctor"
 *                     status:
 *                       type: string
 *                       example: "Active"
 *       400:
 *         description: Bad request - Missing required fields or duplicate data
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
 *                   example: "Missing required fields: name, email, organizationId, hospital, department, roleId, panel"
 *       404:
 *         description: Hospital or Role not found
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
 *                   example: "Hospital not found"
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
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
 *                   example: "Access denied"
 */

//det loggedin employee data
employeeRouter.get("/",getEmployee)
 
employeeRouter.post("/add",addEmployee)

employeeRouter.get("/all",adminVerify,getAllEmployees)

export default employeeRouter;