import express from "express";
import multer from "multer";
import { uploadUniversal } from "../Controllers/uploadController.js";
import { authMiddleware, protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";
import requirePermission from "../Middlewares/PermissionMiddleware.js";
const router = express.Router();

// Multer config for file uploading
const upload = multer({
  dest: "uploads/",
});

/**
 * @swagger
 * /api/upload/universal:
 *   post:
 *     summary: Upload any file (CSV, XLSX, XLS, TXT, TSV)
 *     tags: [Universal Upload]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Upload file of any supported format
 *     responses:
 *       200:
 *         description: File uploaded and inserted
 *       400:
 *         description: Unsupported file format
 *       500:
 *         description: Server error
 */



router.post(
  "/universal",
  authMiddleware,
  requirePermission("asset", "create"),
  upload.single("file"),
  uploadUniversal
);

// quick health-check for the upload router
router.get("/ping", (req, res) => res.json({ ok: true, route: "/api/upload/ping" }));
export default router;

