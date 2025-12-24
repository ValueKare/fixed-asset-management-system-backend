/**
 * @swagger
 * /api/v1/employees:
 *   post:
 *     summary: Create a new employee (doctor/nurse/technician/staff)
 *     tags: [Employees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - empId
 *               - name
 *               - email
 *               - role
 *               - panel
 *               - hospital
 *             properties:
 *               organizationId:
 *                 type: string
 *                 example: HOSP-2024-001
 *
 *               empId:
 *                 type: string
 *                 example: EMP-2024-386
 *
 *               name:
 *                 type: string
 *                 example: Dr. Amit Patel
 *
 *               email:
 *                 type: string
 *                 example: amit.patel@valuekare.com
 *
 *               password:
 *                 type: string
 *                 example: SecurePass123!
 *                 description: Optional. If not provided, a temporary password will be generated.
 *
 *               role:
 *                 type: string
 *                 description: Authority role in workflows (approvals, access)
 *                 example: hod
 *
 *               panel:
 *                 type: string
 *                 description: Professional identity
 *                 example: doctor
 *
 *               hospital:
 *                 type: string
 *                 description: Hospital ObjectId reference
 *                 example: 665f0a9e8f4c3b12d9a1e001
 *
 *               department:
 *                 type: string
 *                 example: Neurology
 *
 *               ward:
 *                 type: string
 *                 example: Ward-5B
 *
 *               contactNumber:
 *                 type: string
 *                 example: "+91-9876543210"
 *
 *               parentUserId:
 *                 type: string
 *                 description: Reporting manager / HOD empId
 *                 example: EMP-2024-120
 *
 *               permissions:
 *                 type: object
 *                 example:
 *                   view_equipment: true
 *                   report_issues: true
 *                   request_replacement: false
 *
 *               joinedDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-12-24
 *
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 userId: EMP-EMP-2024-386
 *                 empId: EMP-2024-386
 *                 name: Dr. Amit Patel
 *                 email: amit.patel@valuekare.com
 *                 role: hod
 *                 panel: doctor
 *                 temporaryPassword: Xy9@kP2!
 *                 resetPasswordRequired: true
 *                 createdAt: 2024-12-23T15:00:00Z
 *               message: Employee created successfully
 *
 *       400:
 *         description: Validation error
 *
 *       500:
 *         description: Internal server error
 *
 *
 * /api/v1/users/{userId}:
 *   put:
 *     summary: Update user details
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *                 example: Emergency
 *               ward:
 *                 type: string
 *                 example: ER-1A
 *               status:
 *                 type: string
 *                 example: Active
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["view_equipment", "report_issues", "request_replacement", "approve_requests"]
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 userId: user_123
 *                 updatedFields: ["department", "ward", "permissions"]
 *                 updatedAt: 2024-12-23T16:00:00Z
 *               message: User updated successfully
 *
 * /api/v1/users/{userId}/permissions:
 *   put:
 *     summary: Update user permissions (rights management)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user's ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: object
 *                 example:
 *                   requests:
 *                     approve: true
 *                   reports:
 *                     export: true
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 userId: user_123
 *                 updatedPermissions: ["requests.approve", "reports.export"]
 *                 updatedAt: 2024-12-23T16:30:00Z
 *               message: Permissions updated successfully
 */
import express from "express";
// Create user
import bcrypt from "bcrypt";
import Employee from "../Models/Employee.js";

const router = express.Router();

// List users with filtering, pagination, and summary
router.get("/api/v1/users", async (req, res) => {
  try {
    const { organizationId, role, status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (organizationId) query.organizationId = organizationId;
    if (role) query.role = role;
    if (status) query.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .skip(skip)
      .limit(parseInt(limit));
    const totalRecords = await User.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / parseInt(limit));
    const allUsers = await User.find(query);
    const activeUsers = allUsers.filter(u => u.status === "Active").length;
    const inactiveUsers = allUsers.filter(u => u.status !== "Active").length;
    res.json({
      success: true,
      data: {
        users: users.map(u => ({
          id: u.userId,
          employeeId: u.employeeId,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
          ward: u.ward,
          status: u.status,
          joinedDate: u.joinedDate,
          lastLogin: u.lastLogin,
          permissions: Array.isArray(u.permissions) ? u.permissions : Object.keys(u.permissions || {}),
          parentUser: u.parentUserId ? { id: u.parentUserId } : undefined
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalRecords
        },
        summary: {
          totalUsers: totalRecords,
          activeUsers,
          inactiveUsers
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



router.post("/api/v1/employees", async (req, res) => {
  try {
    const {
      organizationId,
      empId,
      name,
      email,
      password,
      role,
      panel,
      hospital,
      department,
      ward,
      contactNumber,
      parentUserId,
      permissions,
      joinedDate
    } = req.body;

    // ✅ Required field validation (schema-aligned)
    if (
      !organizationId ||
      !empId ||
      !name ||
      !email ||
      !role ||
      !panel ||
      !hospital
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing"
      });
    }

    // ✅ Generate stable system userId
    const userId = `EMP-${empId}`;

    // ✅ Generate temporary password if not provided
    const tempPassword =
      password || Math.random().toString(36).slice(-8) + "!";

    const employee = await Employee.create({
      userId,
      empId,
      organizationId,
      name,
      email,
      password: tempPassword, // 🔐 hashed by schema pre-save hook
      role,
      panel,
      hospital,
      department,
      ward,
      contactNumber,
      parentUserId,
      permissions: permissions || {},
      joinedDate,
      temporaryPassword: password ? null : tempPassword,
      resetPasswordRequired: true,
      status: "Active"
    });

    res.status(201).json({
      success: true,
      data: {
        userId: employee.userId,
        empId: employee.empId,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        panel: employee.panel,
        resetPasswordRequired: employee.resetPasswordRequired,
        temporaryPassword: employee.temporaryPassword,
        createdAt: employee.createdAt
      },
      message: "Employee created successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



// Update user
router.put("/api/v1/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const updateFields = req.body;
    updateFields.updatedAt = new Date();
    const user = await User.findOneAndUpdate({ userId }, updateFields, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      data: {
        userId: user.userId,
        updatedFields: Object.keys(req.body),
        updatedAt: user.updatedAt.toISOString()
      },
      message: "User updated successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update permissions (rights management)
router.put("/api/v1/users/:userId/permissions", async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    // Merge permissions
    user.permissions = { ...user.permissions, ...permissions };
    user.updatedAt = new Date();
    await user.save();
    res.json({
      success: true,
      data: {
        userId: user.userId,
        updatedPermissions: Object.keys(permissions).flatMap(k => Object.keys(permissions[k]).map(a => `${k}.${a}`)),
        updatedAt: user.updatedAt.toISOString()
      },
      message: "Permissions updated successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
