import express from "express";
import multer from "multer";
import fs from "fs";
import csv from "csv-parser";
import { pool } from "../Config/mysql.js";
import path from "path";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// debug: log incoming requests to this router
router.use((req, res, next) => {
  console.log("csvRouter received:", req.method, req.path);
  next();
});

// Exact CSV headers from your Excel file
const CSV_HEADERS = [
  "Class","BusA","Cost Ctr","S.No","Asset #","Asset Description",
  "Asset Name Mon. Text","Quantity","Amount","D/Cstart","DepQty","Use %",
  "Cost Order","Plnd O.Dep","CoCd","Description","Business area"
];

// Convert Excel date to SQL Date
function parseExcelDate(v) {
  if (!v) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v;

  const parts = v.split(/[-\/]/);
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y.length === 2 ? "20" + y : y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;
  }

  return null;
}

function mapRowToDb(row) {
  return [
    row["Class"] || null,
    row["BusA"] || null,
    row["Cost Ctr"] || row["Cost Ctr"] || null,
    row["S.No"] || row["SNo."] || row["SNo"] || null,
    row["Asset #"] || row["Asset"] || null,
    row["Asset Description"] || null,
    row["Quantity"] ? parseInt(row["Quantity"]) : null,
    row["Amount"] ? parseFloat(String(row["Amount"]).replace(/,/g,"")) : null,
    parseExcelDate(row["D/Cstart"] || row["DCStart"] || row["D Cstart"]),
    row["DepQty"] || row["DepKy"] || null,
    row["Use %"] || row["Use"] || null,
    row["Cost Order"] || null,
    row["Plnd O.Dep"] ? parseFloat(String(row["Plnd O.Dep"]).replace(/,/g,"")) : null,
    row["CoCd"] || null,
    row["Description"] || null,
    row["Business area"] || null
  ];
}

/**
 * @swagger
 * /api/upload/upload-excel:
 *   post:
 *     summary: Upload CSV file and insert into MySQL assets table
 *     tags: [MySQL Assets]
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
 *         description: CSV uploaded into MySQL successfully
 *       400:
 *         description: No file uploaded or CSV invalid
 *       500:
 *         description: Server error
 */
router.post("/upload-excel", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const filePath = path.resolve(req.file.path);
  const rows = [];

  try {
    // Read CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => rows.push(mapRowToDb(data)))
        .on("end", resolve)
        .on("error", reject);
    });

    if (rows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "CSV is empty or unreadable" });
    }

    // Insert into MySQL
    const db = pool;

    const sql = `
     INSERT INTO nbc_assets
      (class, bus_A, cost_centre, sno, asset, asset_description,
       quantity, amount, dc_start, depky, use_percentage, CostOrder, planned_dep,
       CoCd, description, business_area)
      VALUES ?
    `;

    await db.query(sql, [rows]);

    fs.unlinkSync(filePath);

    res.json({
      message: "CSV uploaded into MySQL successfully",
      inserted: rows.length
    });

    } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: err.message });
  }
});

export default router;
