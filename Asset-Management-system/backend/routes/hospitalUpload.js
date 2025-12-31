import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import XLSX from "xlsx";
import { pool } from "../Config/mysql.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const normalizeKey = key =>
  key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

// Helper function to format date consistently
const formatDate = (dateValue) => {
  if (!dateValue) return null;
  
  let date;
  if (typeof dateValue === "string") {
    date = new Date(dateValue);
  } else if (typeof dateValue === "number") {
    // Excel serial number
    date = new Date((dateValue - 25569) * 86400 * 1000);
  } else {
    return null;
  }
  
  if (isNaN(date.getTime())) return null;
  
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

// Validation helper
const validateRow = (row, index) => {
  const errors = [];
  
  if (!row.sr_no) errors.push(`Row ${index}: sr_no is required`);
  if (!row.aster_tag_number) errors.push(`Row ${index}: aster_tag_number is required`);
  if (!row.asset_key) errors.push(`Row ${index}: asset_key is required`);
  
  return errors;
};

router.post("/hospital-assets", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = path.resolve(req.file.path);
  const ext = path.extname(req.file.originalname).toLowerCase();
  const rows = [];
  const assetKeys = new Set();
  const validationErrors = [];

  try {
    // ===================== CSV / TXT =====================
    if (ext === ".csv" || ext === ".txt") {
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (raw, index) => {
            const row = {};
            Object.keys(raw).forEach(k => {
              row[normalizeKey(k)] = raw[k];
            });

            // Validate row
            const errors = validateRow(row, rows.length + 1);
            if (errors.length > 0) {
              validationErrors.push(...errors);
              return;
            }

            // Check for duplicates
            if (assetKeys.has(row.asset_key)) {
              validationErrors.push(`Duplicate asset_key: ${row.asset_key}`);
              return;
            }
            assetKeys.add(row.asset_key);

            rows.push([
              row.sr_no,
              row.aster_tag_number,
              row.vk_new_tag_number || null,
              row.make || null,
              row.model || null,
              row.block || null,
              row.wing || null,
              row.floor || null,
              row.location || null,
              row.aster_information_not_in_far || null,  // Fixed: matches DB column aster_info_not_in_far
              row.vk_remarks || null,
              row.fa_reco_resolution_vk_remarks || null,  // Fixed: matches DB column fa_reco_resolution
              row.aster_spoc_remarks || null,
              formatDate(row.audit_date),
              row.asset_key
            ]);
          })
          .on("end", resolve)
          .on("error", reject);
      });
    }

    // ===================== EXCEL =====================
    else if (ext === ".xlsx" || ext === ".xls") {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: null });

      json.forEach((raw, index) => {
        const row = {};
        Object.keys(raw).forEach(k => {
          row[normalizeKey(k)] = raw[k];
        });

        // Validate row
        const errors = validateRow(row, index + 1);
        if (errors.length > 0) {
          validationErrors.push(...errors);
          return;
        }

        // Check for duplicates
        if (assetKeys.has(row.asset_key)) {
          validationErrors.push(`Duplicate asset_key: ${row.asset_key}`);
          return;
        }
        assetKeys.add(row.asset_key);

        rows.push([
          row.sr_no,
          row.aster_tag_number,
          row.vk_new_tag_number || null,
          row.make || null,
          row.model || null,
          row.block || null,
          row.wing || null,
          row.floor || null,
          row.location || null,
          row.aster_information_not_in_far || null,  // Fixed: matches DB column aster_info_not_in_far
          row.vk_remarks || null,
          row.fa_reco_resolution_vk_remarks || null,  // Fixed: matches DB column fa_reco_resolution
          row.aster_spoc_remarks || null,
          formatDate(row.audit_date),  // Fixed: consistent with CSV processing
          row.asset_key
        ]);
      });
    }

    // ===================== INVALID FILE =====================
    else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "Unsupported file format" });
    }

    // Check for validation errors
    if (validationErrors.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors
      });
    }

    if (!rows.length) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: "No valid rows found in file" });
    }

    // Check for duplicate asset_keys in database
    const assetKeysArray = Array.from(assetKeys);
    const checkQuery = `SELECT asset_key FROM hospital_assets WHERE asset_key IN (?)`;
    
    const [existingKeys] = await pool.query(checkQuery, [assetKeysArray]);
    if (existingKeys.length > 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        message: "Some asset_keys already exist in database",
        duplicates: existingKeys.map(k => k.asset_key)
      });
    }

    const sql = `
      INSERT INTO hospital_assets (
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
      ) VALUES ?
    `;

    await pool.query(sql, [rows]);

    fs.unlinkSync(filePath);

    res.json({
      message: "File uploaded successfully",
      inserted: rows.length
    });
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: err.message });
  }
});

export default router;