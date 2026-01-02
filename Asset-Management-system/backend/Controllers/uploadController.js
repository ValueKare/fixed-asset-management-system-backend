import fs from "fs";
import csv from "csv-parser";
import XLSX from "xlsx";
import iconv from "iconv-lite";
import { pool } from "../Config/mysql.js";
import { generateBarcode } from "./barcodeUtil.js";
//Barcode generation
const normalizeKey = (key) =>
  key.toLowerCase().replace(/[\s\.\-%]/g, "_").replace(/_+/g, "_").replace(/^_|_$/, "");

const headerMap = {
  class: ["class"],
  busa: ["busa", "bus_a"],
  cost_ctr: ["cost_ctr", "cost_centre"],
  s_no: ["s_no", "sno","SNo."],
  asset: ["asset"],
  asset_description: ["asset_description"],
  asset_main_no_text: ["asset_main_no_text"],
  quantity: ["quantity"],
  amount: ["amount"],
  dc_start: ["dc_start","DCStart"],
  dep: ["dep", "depky"],
  use: ["use"],
  cost_order: ["cost_order"],
  pln_o_dep: ["pln_o_dep","Plnd_O_Dep","Planned_Obligations_Depreciation"],
  cocd: ["cocd"],
  description: ["description"],
  business_area: ["business_area"]
};

function buildColumnMap(headers) {
  const map = {};
  headers.forEach(h => {
    const norm = normalizeKey(h);
    for (const [col, vals] of Object.entries(headerMap)) {
      if (vals.includes(norm)) {
        map[h] = col;
        break;
      }
    }
  });
  return map;
}

async function generateAssetKey(assetNo) {
  if (!assetNo || assetNo === "undefined") {
    const ts = Date.now();
    const rand = Math.random().toString(36).substr(2, 5);
    return `ASSET_${ts}_${rand}`;
  }
  const [rows] = await pool.query("SELECT COUNT(*) AS cnt FROM nbc_assets WHERE asset = ?", [assetNo]);
  return assetNo + String(rows[0].cnt).padStart(3, "0");
}

export const uploadUniversal = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file" });

    let rows = [], headers = [];
    const isExcel = req.file.originalname.toLowerCase().endsWith(".xlsx");

    if (isExcel) {
      const wb = XLSX.readFile(req.file.path);
      rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      headers = Object.keys(rows[0] || {});
    } else {
      await new Promise((resolve, reject) => {
        const csvRows = [];
        fs.createReadStream(req.file.path)
          .pipe(iconv.decodeStream("latin1"))
          .pipe(csv())
          .on("headers", h => { headers = h; console.log("Headers:", h); })
          .on("data", d => csvRows.push(d))
          .on("end", () => { rows = csvRows; resolve(); })
          .on("error", reject);
      });
    }

    if (rows.length === 0) return res.status(400).json({ message: "No data" });

    const map = buildColumnMap(headers);
    console.log("Column mapping:", map);

    const normalized = rows.map((r, i) => {
      const n = {};
      for (const [k, v] of Object.entries(r)) {
        n[map[k] || normalizeKey(k)] = v;
      }
      if (i === 0) console.log("Row 1:", n);
      return n;
    });

    let inserted = 0, errs = [];
//normalized.length
    for (let i = 0; i < 5; i++) {
      const r = normalized[i];
      if (!r.asset) continue;

      try {
        const key = await generateAssetKey(r.asset);
        console.log(`Row ${i + 1}: asset=${r.asset}, key=${key}`);

        // Prepare barcode components and generate barcode
        const costCentre = String(r.cost_ctr || "").padStart(6, "0");
        const busA = String(r.busa || "").padStart(6, "0");
        const assetClass = String(r.class || "").padStart(4, "0");
        const barcode = generateBarcode(costCentre, busA, assetClass);

        await pool.query(
          `INSERT INTO nbc_assets  (class, bus_A, cost_centre, sno, asset, asset_description, asset_main_no_text, quantity, amount, dc_start, depky, use_percentage, CostOrder, planned_dep, CoCd, description, business_area, barcode, asset_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.class||null, r.busa||null, r.cost_ctr||null, r.s_no||null, r.asset||null, r.asset_description||null, r.asset_main_no_text||null, r.quantity||null, r.amount||null, r.dcstart||null, r.dep||null, r.use||null, r.cost_order||null, r.plnd_o_dep||null, r.cocd||null, r.description||null, r.business_area||null, barcode, key]
        );
        
        await pool.query(
          `INSERT INTO hospital_assets (sr_no, aster_tag_number, vk_new_tag_number, make, model, block, wing, floor, location, aster_info_not_in_far, vk_remarks, fa_reco_resolution, aster_spoc_remarks, audit_date, asset_key, asset) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [r.sr_no||null, r.aster_tag_number||null, r.vk_new_tag_number||null, r.make||null, r.model||null, r.block||null, r.wing||null, r.floor||null, r.location||null, r.aster_info_not_in_far||null, r.vk_remarks||null, r.fa_reco_resolution||null, r.aster_spoc_remarks||null, r.audit_date||null, key, r.asset||null]
        );

        inserted++;
      } catch (e) {
        errs.push({ row: i + 1, error: e.message });
        console.error(`Row ${i + 1}:`, e.message);
      }
    }

    res.json({ message: "Done", inserted, total: normalized.length, errors: errs.length > 0 ? errs : undefined });
    fs.unlinkSync(req.file.path);
  } catch (e) {
    console.error("Error:", e.message);
    res.status(500).json({ message: "Failed", error: e.message });
  }
};
