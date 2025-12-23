import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Admin from "../Models/Admin.js";
import {
  assignedAsset,
  getAllAssets,
  returnAssignedAsset,
} from "../Controllers/adminController.js";

const adminRouter = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin account management and asset assignment APIs
 */

/**
 * @swagger
 * /api/admin/signup:
 *   post:
 *     summary: Register a new admin account
 *     tags: [Admin]
 *     description: Allows creation of a new admin user. The password will be securely hashed before saving to the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin123
 *               password:
 *                 type: string
 *                 example: myStrongPassword@123
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Admin created successfully
 *       400:
 *         description: Admin already exists
 *         content:
 *           application/json:
 *             example:
 *               message: Admin already exists
 *       500:
 *         description: Server error while creating admin
 */
adminRouter.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({ username, password: hashedPassword });
    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Error creating admin" });
  }
});

/**
 * @swagger
 * /api/admin/signin:
 *   post:
 *     summary: Admin login to get JWT token
 *     tags: [Admin]
 *     description: Authenticates admin credentials and returns a JWT token for further requests.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin123
 *               password:
 *                 type: string
 *                 example: myStrongPassword@123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               message: Login successful
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
adminRouter.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Wrong password" });

    const token = jwt.sign(
      { username, role: "admin" },
      process.env.JWT_SECRET || "sonu_server",
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Signin Error:", error);
    res.status(500).json({ message: "Error signing in" });
  }
});

/**
 * @swagger
 * /api/admin/assign/asset:
 *   post:
 *     summary: Assign an asset to an employee
 *     tags: [Admin]
 *     description: Admin assigns an available asset to a specific employee.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - empId
 *               - assetTag
 *               - assignedAt
 *             properties:
 *               empId:
 *                 type: string
 *                 example: EMP123
 *               assetTag:
 *                 type: string
 *                 example: ASSET001
 *               assignedAt:
 *                 type: string
 *                 format: date
 *                 example: 2025-11-07
 *     responses:
 *       201:
 *         description: Asset assigned successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Asset assigned successfully"
 *       400:
 *         description: Invalid or unavailable asset
 *       500:
 *         description: Server error
 */
adminRouter.post("/assign/asset", assignedAsset);

/**
 * @swagger
 * /api/admin/return/asset:
 *   put:
 *     summary: Mark an assigned asset as returned
 *     tags: [Admin]
 *     description: Updates the asset and employee record to reflect that the asset has been returned.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetTag
 *               - returnedAt
 *             properties:
 *               assetTag:
 *                 type: string
 *                 example: ASSET001
 *               returnedAt:
 *                 type: string
 *                 format: date
 *                 example: 2025-11-11
 *               returnedCondition:
 *                 type: string
 *                 example: Good
 *               note:
 *                 type: string
 *                 example: "Returned after maintenance"
 *     responses:
 *       200:
 *         description: Asset returned successfully
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Server error
 */
adminRouter.put("/return/asset", returnAssignedAsset);

/**
 * @swagger
 * /api/admin/assign/all:
 *   get:
 *     summary: Get all assigned assets
 *     tags: [Admin]
 *     description: Retrieves all assigned assets with employee and asset details.
 *     responses:
 *       200:
 *         description: Successfully fetched all assigned assets
 *         content:
 *           application/json:
 *             example:
 *               [
 *                 {
 *                   employeeName: "John Doe",
 *                   employeeId: "EMP123",
 *                   assetName: "MRI Scanner",
 *                   assetId: "ASSET001",
 *                   assignedDate: "2025-11-07",
 *                   returnStatus: false
 *                 }
 *               ]
 *       500:
 *         description: Server error
 */
adminRouter.get("/assign/all", getAllAssets);

export default adminRouter;

