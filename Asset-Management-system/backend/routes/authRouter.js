import express from "express";
import {
  adminLogin,
  employeeLogin,
  getAuthStatus,
  logout,
  getUserActivity,      // NEW
  getOnlineStatus,      // NEW
  getOnlineUsers,
  adminSignup,
  userLogin
} from "../Controllers/authController.js";
import {
  refreshAccessToken,
  forgotPassword,
  resetPassword,
} from "../Controllers/tokenController.js"; // You can merge these into authController if preferred

const authRouter = express.Router();
/**
 * @swagger
 * /api/auth/admin/signup:
 *   post:
 *     summary: Admin signup
 *     tags: [Authentication]
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
 *                 example: admin@gmail.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             example:
 *               message: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
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
 *               role: admin
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

export default authRouter;
