import express from "express";
import {
  adminLogin,
  superadminLogin,
  hospitalAdminLogin,
  createHospitalAdmin,
  employeeLogin,
  getAuthStatus,
  logout,
  getUserActivity,      // NEW
  getOnlineStatus,      // NEW
  getOnlineUsers,
  adminSignup,
  userLogin,
  login,
  validateSession       // NEW
} from "../Controllers/authController.js";
import {
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from "../Controllers/tokenController.js"; // You can merge these into authController if preferred
import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";
const authRouter = express.Router();
/**
 * @swagger
 * /api/auth/admin/signup:
 *   post:
 *     summary: Register a new admin account
 *     tags: [Admin]
 *     description: Allows creation of a new admin user. The password will be securely hashed before saving to the database. The role will be set to 'admin' by default.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - panel
 *               - organizationId
 *             properties:
 *               username:
 *                 type: string
 *                 description: The admin's username
 *                 example: adminuser
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The admin's email address
 *                 example: admin@gmail.com
 *               password:
 *                 type: string
 *                 description: The admin's password (will be hashed)
 *                 example: admin123
 *               panel:
 *                 type: string
 *                 description: The admin's panel assignment
 *                 example: superadmin
 *               organizationId:
 *                 type: string
 *                 description: The organization ID for the admin (required for superadmin)
 *                 example: org_123456789
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin created successfully
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Admin user ID
 *                     username:
 *                       type: string
 *                       description: Admin username
 *                     email:
 *                       type: string
 *                       description: Admin email
 *                     role:
 *                       type: string
 *                       enum: ["admin", "superadmin"]
 *                       description: Admin role (always set to 'admin' on creation)
 *                       example: admin
 *                     panel:
 *                       type: string
 *                       description: Admin panel assignment
 *                       example: superadmin
 *                     organizationId:
 *                       type: string
 *                       description: Organization ID
 *                       example: org_123456789
 *               example:
 *                 message: Admin created successfully
 *                 admin:
 *                   id: 64f1a2b3c4d5e6f7g8h9i0j1
 *                   username: adminuser
 *                   email: admin@gmail.com
 *                   role: admin
 *                   panel: superadmin
 *                   organizationId: org_123456789
 *       400:
 *         description: Bad request - missing required fields or admin already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Username, password, panel, and organizationId are required
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 */
authRouter.post("/admin/signup", adminSignup);


/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication, authorization, and password management endpoints
 */

/**
 * @swagger
 * /api/auth/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Authentication]
 *     description: Allows an admin to log in and receive a JWT token stored as an HTTP-only cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The admin's email address
 *                 example: admin@gmail.com
 *               password:
 *                 type: string
 *                 description: The admin's password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin login successful
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Admin user ID
 *                     username:
 *                       type: string
 *                       description: Admin username
 *                     email:
 *                       type: string
 *                       description: Admin email
 *                     role:
 *                       type: string
 *                       example: admin
 *                       description: User role
 *               example:
 *                 message: Admin login successful
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   id: 64f1a2b3c4d5e6f7g8h9i0j1
 *                   username: adminuser
 *                   email: admin@gmail.com
 *                   role: admin
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email and password are required
 *       401:
 *         description: Invalid credentials - email not found or password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 */
/**
 * @swagger
 * /api/auth/superadmin/login:
 *   post:
 *     summary: Superadmin login
 *     tags: [Superadmin]
 *     description: Allows a superadmin to log in and receive a JWT token stored as an HTTP-only cookie. Superadmin can create organizations, hospitals, and manage admin permissions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: The superadmin's username
 *                 example: superadmin
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The superadmin's email address
 *                 example: superadmin@company.com
 *               password:
 *                 type: string
 *                 description: The superadmin's password
 *                 example: superadmin123
 *     responses:
 *       200:
 *         description: Superadmin login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Superadmin login successful
 *                 token:
 *                   type: string
 *                   description: JWT authentication token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: Superadmin user ID
 *                     username:
 *                       type: string
 *                       description: Superadmin username
 *                     email:
 *                       type: string
 *                       description: Superadmin email
 *                     role:
 *                       type: string
 *                       example: superadmin
 *                       description: User role
 *                     panel:
 *                       type: string
 *                       description: Superadmin panel assignment
 *                     organizationId:
 *                       type: string
 *                       description: Organization ID
 *               example:
 *                 message: Superadmin login successful
 *                 token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   id: 64f1a2b3c4d5e6f7g8h9i0j1
 *                   username: superadmin
 *                   email: superadmin@company.com
 *                   role: superadmin
 *                   panel: superadmin
 *                   organizationId: org_123456789
 *       400:
 *         description: Bad request - missing password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password is required
 *       401:
 *         description: Invalid credentials - superadmin not found or password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Superadmin not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 */
authRouter.post("/superadmin/login", superadminLogin);

authRouter.post("/admin/login", adminLogin);

/**
 * @swagger
 * /api/auth/employee/login:
 *   post:
 *     summary: Employee login
 *     tags: [Authentication]
 *     description: Allows an employee to log in and receive a JWT token stored as an HTTP-only cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: employee@gmail.com
 *               password:
 *                 type: string
 *                 example: employee123
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
authRouter.post("/employee/login", employeeLogin);

/**
 * @swagger
 * /api/auth/hospital-admin/login:
 *   post:
 *     summary: Hospital Admin login
 *     tags: [Hospital Admin]
 *     description: Authenticate a hospital admin using organizationId, email, and password. Returns JWT tokens and user details with hospital information.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - email
 *               - password
 *             properties:
 *               organizationId:
 *                 type: string
 *                 description: The organization ID
 *                 example: org_123456789
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The hospital admin's email address
 *                 example: admin@hospital.com
 *               password:
 *                 type: string
 *                 description: The hospital admin's password
 *                 example: password123
 *               rememberMe:
 *                 type: boolean
 *                 description: Remember login for extended session
 *                 example: false
 *     responses:
 *       200:
 *         description: Hospital admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token
 *                     expiresIn:
 *                       type: number
 *                       description: Token expiration time in seconds
 *                       example: 3600
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Admin user ID
 *                         username:
 *                           type: string
 *                           description: Admin username
 *                         email:
 *                           type: string
 *                           description: Admin email
 *                         role:
 *                           type: string
 *                           example: admin
 *                           description: User role
 *                         panel:
 *                           type: string
 *                           description: Admin panel assignment
 *                         organizationId:
 *                           type: string
 *                           description: Organization ID
 *                         hospitalId:
 *                           type: string
 *                           description: Hospital ID
 *                     hospital:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Hospital ID
 *                         name:
 *                           type: string
 *                           description: Hospital name
 *                         location:
 *                           type: string
 *                           description: Hospital location
 *                         contactEmail:
 *                           type: string
 *                           description: Hospital contact email
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: MISSING_FIELDS
 *                     message:
 *                       type: string
 *                       example: organizationId, email, and password are required
 *       401:
 *         description: Invalid credentials - admin not found or password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: INVALID_CREDENTIALS
 *                     message:
 *                       type: string
 *                       example: Invalid email or password
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: SERVER_ERROR
 *                     message:
 *                       type: string
 *                       description: Error message
 */
authRouter.post("/hospital-admin/login", hospitalAdminLogin);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Unified user login
 *     tags: [Authentication]
 *     description: >
 *       Authenticates any user of the Fixed Asset Management system using a unified login flow.
 *       This endpoint supports SuperAdmin, Hospital Admin, Employee, and Auditor logins.
 *       The client does not specify the role; the system resolves the user identity and role
 *       server-side based on stored credentials and role assignments.
 *
 *       Authorization is enforced using roleId and permission middleware.
 *       Role values returned in the response are for UI purposes only.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - email
 *               - password
 *             properties:
 *               organizationId:
 *                 type: string
 *                 description: >
 *                   Organization identifier. For SuperAdmins, this must be the platform
 *                   (auditing company) organizationId. For other users, this must be the
 *                   subscribed client organizationId.
 *                 example: ORG_001
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *                 example: user@organization.com
 *               password:
 *                 type: string
 *                 description: User account password
 *                 example: StrongPassword@123
 *               rememberMe:
 *                 type: boolean
 *                 description: Remember login for extended session duration
 *                 example: true
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token
 *                     expiresIn:
 *                       type: number
 *                       description: Token expiration time in seconds
 *                       example: 3600
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: User unique identifier
 *                         username:
 *                           type: string
 *                           nullable: true
 *                           description: Username (admins only)
 *                         name:
 *                           type: string
 *                           nullable: true
 *                           description: Full name (employees/auditors)
 *                         email:
 *                           type: string
 *                           description: User email address
 *                         role:
 *                           type: string
 *                           example: superadmin
 *                           description: >
 *                             Role label for UI display only.
 *                             Not used for authorization.
 *                         panel:
 *                           type: string
 *                           nullable: true
 *                           description: UI routing panel (platform, hospital, employee)
 *                         organizationId:
 *                           type: string
 *                           description: Organization ID associated with the user
 *                         hospitalId:
 *                           type: string
 *                           nullable: true
 *                           description: Hospital ID if user belongs to a hospital
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: MISSING_FIELDS
 *                     message:
 *                       type: string
 *                       example: organizationId, email, and password are required
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: INVALID_CREDENTIALS
 *                     message:
 *                       type: string
 *                       example: Invalid email or password
 *       403:
 *         description: Invalid organization for the given user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: INVALID_ORGANIZATION
 *                     message:
 *                       type: string
 *                       example: User is not allowed to log in under this organization
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: SERVER_ERROR
 *                     message:
 *                       type: string
 *                       description: Error message
 */

authRouter.post("/login",login);

/**
 * @swagger
 * /api/auth/create-hospital-admin:
 *   post:
 *     summary: Create Hospital Admin
 *     tags: [Superadmin]
 *     description: Allows a superadmin to create a new hospital admin with specified permissions and hospital assignment.
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
 *               - username
 *               - email
 *               - password
 *               - organizationId
 *               - hospitalId
 *             properties:
 *               username:
 *                 type: string
 *                 description: The admin's username
 *                 example: hospitaladmin
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The admin's email address
 *                 example: admin@hospital.com
 *               password:
 *                 type: string
 *                 description: The admin's password (will be hashed)
 *                 example: password123
 *               panel:
 *                 type: string
 *                 description: The admin's panel assignment
 *                 example: admin
 *               organizationId:
 *                 type: string
 *                 description: The organization ID
 *                 example: org_123456789
 *               hospitalId:
 *                 type: string
 *                 description: The hospital ID where admin will be assigned
 *                 example: 64f1a2b3c4d5e6f7g8h9i0j1
 *               permissions:
 *                 type: object
 *                 description: The admin's permissions object
 *                 example:
 *                   assets: ["read", "write", "delete"]
 *                   employees: ["read", "write"]
 *               name:
 *                 type: string
 *                 description: The admin's display name
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: Hospital admin created successfully
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
 *                   example: Hospital admin created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Admin user ID
 *                         username:
 *                           type: string
 *                           description: Admin username
 *                         email:
 *                           type: string
 *                           description: Admin email
 *                         role:
 *                           type: string
 *                           example: admin
 *                           description: User role
 *                         panel:
 *                           type: string
 *                           description: Admin panel assignment
 *                         organizationId:
 *                           type: string
 *                           description: Organization ID
 *                         hospitalId:
 *                           type: string
 *                           description: Hospital ID
 *                         permissions:
 *                           type: object
 *                           description: Admin permissions
 *                         name:
 *                           type: string
 *                           description: Admin display name
 *                     hospital:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Hospital ID
 *                         name:
 *                           type: string
 *                           description: Hospital name
 *                         location:
 *                           type: string
 *                           description: Hospital location
 *                         contactEmail:
 *                           type: string
 *                           description: Hospital contact email
 *               example:
 *                 success: true
 *                 message: Hospital admin created successfully
 *                 data:
 *                   admin:
 *                     id: 64f1a2b3c4d5e6f7g8h9i0j1
 *                     username: hospitaladmin
 *                     email: admin@hospital.com
 *                     role: admin
 *                     panel: admin
 *                     organizationId: org_123456789
 *                     hospitalId: 64f1a2b3c4d5e6f7g8h9i0j1
 *                     permissions:
 *                       assets: ["read", "write", "delete"]
 *                       employees: ["read", "write"]
 *                     name: John Doe
 *                   hospital:
 *                     id: 64f1a2b3c4d5e6f7g8h9i0j1
 *                     name: General Hospital
 *                     location: New York, NY
 *                     contactEmail: info@generalhospital.com
 *       400:
 *         description: Bad request - missing required fields or validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: MISSING_FIELDS
 *                     message:
 *                       type: string
 *                       example: username, email, password, organizationId, and hospitalId are required
 *       401:
 *         description: Unauthorized - superadmin authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: UNAUTHORIZED
 *                     message:
 *                       type: string
 *                       example: Superadmin access required
 *       404:
 *         description: Hospital not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: HOSPITAL_NOT_FOUND
 *                     message:
 *                       type: string
 *                       example: Hospital not found
 *       409:
 *         description: Admin already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: ADMIN_EXISTS
 *                     message:
 *                       type: string
 *                       example: Admin with this username or email already exists
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: SERVER_ERROR
 *                     message:
 *                       type: string
 *                       description: Error message
 */
authRouter.post("/create-hospital-admin", protect, authorizeRoles('superadmin'), createHospitalAdmin);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Authentication]
 *     description: Retrieve the details and role of the currently authenticated user using the stored JWT cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Returns user details and role
 *         content:
 *           application/json:
 *             example:
 *               user:
 *                 name: Admin User
 *                 email: admin@gmail.com
 *                 role: admin
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
authRouter.get("/me", getAuthStatus);

/**
 * @swagger
 * /api/auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: Clears the authentication token cookie and logs out the user.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             example:
 *               message: Logout successful
 *       500:
 *         description: Server error
 */
authRouter.get("/logout", logout);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token using a refresh token
 *     tags: [Authentication]
 *     description: Generates a new access token using a valid refresh token.
 *     responses:
 *       200:
 *         description: Access token refreshed
 *         content:
 *           application/json:
 *             example:
 *               accessToken: newAccessToken
 *       401:
 *         description: No refresh token provided
 *       403:
 *         description: Invalid or expired token
 */
authRouter.post("/refresh-token", refreshAccessToken);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset link via email
 *     tags: [Authentication]
 *     description: Sends a password reset link with a secure token to the user's email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 */
authRouter.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     summary: Reset password using reset token
 *     tags: [Authentication]
 *     description: Resets the user's password using a secure token from their email.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 example: NewStrongPassword123
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid or expired token
 */
authRouter.post("/reset-password/:token", resetPassword);


/**
 * @swagger
 * /api/auth/activity:
 *   get:
 *     summary: Get user's login/logout activity history
 *     tags: [Authentication]
 *     description: Retrieve the last 50 login/logout activities for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Activity history retrieved
 *       401:
 *         description: Unauthorized
 */
authRouter.get("/activity", getUserActivity);

/**
 * @swagger
 * /api/auth/online-status:
 *   get:
 *     summary: Check current online status
 *     tags: [Authentication]
 *     description: Get the online status and last login/logout times for the authenticated user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Status retrieved
 *       401:
 *         description: Unauthorized
 */
authRouter.get("/online-status", getOnlineStatus);

/**
 * @swagger
 * /api/auth/online-users:
 *   get:
 *     summary: Get all currently online users (Admin only)
 *     tags: [Authentication]
 *     description: Retrieve a list of all users currently logged in
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Online users list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
authRouter.get("/online-users", getOnlineUsers);

/**
 * @swagger
 * /api/auth/user/login:
 *   post:
 *     summary: User login (doctor, nurse, etc.)
 *     tags: [Authentication]
 *     description: Authenticates a user by organizationId/email/password, returns JWT/refresh token, user/org info, and permissions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - organizationId
 *               - email
 *               - password
 *             properties:
 *               organizationId:
 *                 type: string
 *                 example: HOSP-2024-001
 *               email:
 *                 type: string
 *                 example: doctor@valuekare.com
 *               password:
 *                 type: string
 *                 example: encrypted_password_hash
 *               rememberMe:
 *                 type: boolean
 *                 example: true
 *               deviceInfo:
 *                 type: object
 *                 properties:
 *                   userAgent:
 *                     type: string
 *                   ipAddress:
 *                     type: string
 *                   deviceType:
 *                     type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 expiresIn: 3600
 *                 user:
 *                   id: "user_12345"
 *                   email: "doctor@valuekare.com"
 *                   name: "Dr. Sarah Johnson"
 *                   role: "doctor"
 *                   panel: "user"
 *                   organizationId: "HOSP-2024-001"
 *                   organizationName: "ValueKare Medical Center"
 *                   department: "Cardiology"
 *                   ward: "Ward-3A"
 *                   permissions: ["view_equipment", "report_issues", "request_replacement"]
 *                 organization:
 *                   id: "HOSP-2024-001"
 *                   name: "ValueKare Medical Center"
 *                   logo: "https://cdn.valuekare.com/logos/hosp-001.png"
 *                   timezone: "Asia/Kolkata"
 *                   currency: "INR"
 *       401:
 *         description: Invalid credentials or organization
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error:
 *                 code: "INVALID_CREDENTIALS"
 *                 message: "Invalid email or password"
 *                 details: null
 */
authRouter.post("/user/login", userLogin);

/**
 * @swagger
 * /api/auth/validate-session:
 *   get:
 *     summary: Validate user session
 *     tags: [Authentication]
 *     description: Validates if the current session token is still active and not invalidated by a new login
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         description: Bearer token for session validation
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Session is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "64f1a2b3c4d5e6f7g8h9i0j1"
 *                     isOnline:
 *                       type: boolean
 *                       example: true
 *                     sessionIssuedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-09T10:00:00.000Z"
 *       401:
 *         description: Session invalid or token issues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       enum: ["NO_TOKEN", "INVALID_TOKEN", "TOKEN_EXPIRED", "SESSION_INVALIDATED"]
 *                     message:
 *                       type: string
 *                       example: "Session invalidated by new login"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: "SERVER_ERROR"
 *                     message:
 *                       type: string
 *                       example: "Internal server error"
 */
authRouter.get("/validate-session", validateSession);

export default authRouter;
