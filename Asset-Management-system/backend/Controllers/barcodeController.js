import { pool as db } from "../Config/mysql.js";
import bwipjs from "bwip-js";
import PDFDocument from "pdfkit";

export const generateBarcode = async (req, res) => {
  try {
    const assetId = req.params.assetId;

    const [rows] = await db.query(`SELECT * FROM assets WHERE id = ?`, [assetId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Asset not found" });
    }

    const asset = rows[0];

    // Convert to barcode components
    const costCentre = String(asset.cost_centre || "").padStart(6, "0");
    const busA = String(asset.bus_A || "").padStart(6, "0");
    const assetClass = String(asset.class || "").padStart(4, "0");

    // Use shared utility for barcode value
    const { generateBarcode } = await import("./barcodeUtil.js");
    const barcodeValue = generateBarcode(costCentre, busA, assetClass);

    // Generate barcode image
    const barcodePng = await bwipjs.toBuffer({
      bcid: "code128",
      text: barcodeValue,
      scale: 3,
      height: 12,
      includetext: true,
    });

    // Generate PDF
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");

    doc.fontSize(16).text("Asset Barcode", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Asset No: ${asset.asset}`);
    doc.text(`Description: ${asset.asset_description}`);
    doc.text(`Cost Centre: ${asset.cost_centre}`);
    doc.text(`BusA: ${asset.bus_A}`);
    doc.text(`Class: ${asset.class}`);
    doc.text(`Generated Barcode: ${barcodeValue}`, { underline: true });

    doc.moveDown();
    doc.image(barcodePng, { width: 260, align: "center" });

    doc.end();
    doc.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Barcode generation error" });
  }
};


