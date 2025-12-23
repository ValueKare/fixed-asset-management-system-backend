import express from "express";
import multer from "multer";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import { pool } from "../Config/mysql.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * /api/upload/hospital-assets:
 *   post:
 *     summary: Upload Hospital Audit CSV into hospital_assets table
 *     tags: [Hospital Assets]
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
 *     responses:
 *       200:
 *         description: Hospital CSV uploaded successfully
 *       400:
 *         description: No file uploaded
 *       500:
 *         description: Server error
 */
router.post(
  "/hospital-assets",
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = path.resolve(req.file.path);
    const rows = [];

    try {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
        .on("data", (row) => {
  rows.push([
    row["SR. No"] || row["SR No"] || row["Sr No"] || null,
    row["Aster Tag Number"] || row["Aster Tag No"] || null,
    row["VK New Tag Number"] || row["VK New Tag No"] || null,
    row["Make"] || row["Make "] || null,
    row["Model"] || null,
    row["Block"] || null,
    row["Wing"] || null,
    row["Floor"] || null,
    row["Location"] || null,
    row["Aster Information Not In FAR"] || null,
    row["VK Remarks"] || null,
    row["FA reco resolution VK Remarks"] || row["FA reco resolution"] || null,
    row["Aster Spoc Remarks"] || null,
    row["Audit date"] || row["Audit Date"] || null,
    row["Asset Key"] || row["asset_key"] || null
  ]);
})
  
          .on("end", resolve)
          .on("error", reject);
      });

      if (rows.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: "CSV empty" });
      }

      const sql =  `
              INSERT INTO hospital_assets
        (
          sr_no,
          aster_tag_number,
          vk_new_tag_number,
          make,
          model,
          block,
          wing,
          floor,
          location,
          aster_info_not_in_far,
          vk_remarks,
          fa_reco_resolution,
          aster_spoc_remarks,
          audit_date,
          asset_key
        )
        VALUES ?
      `;

      await pool.query(sql, [rows]);

      fs.unlinkSync(filePath);

      res.json({
        message: "Hospital CSV uploaded successfully",
        inserted: rows.length
      });
    } catch (err) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
