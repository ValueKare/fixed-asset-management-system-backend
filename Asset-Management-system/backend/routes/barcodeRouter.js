import express from "express";
import { generateBarcode } from "../Controllers/barcodeController.js";

const router = express.Router();

/**
 * @swagger
 * /api/barcode/{assetId}:
 *   get:
 *     summary: Generate barcode PDF for an asset
 *     tags: [Barcode]
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB Asset ID
 *     responses:
 *       200:
 *         description: Barcode PDF generated successfully
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Server error
 */
router.get("/:assetId", generateBarcode);

export default router;
