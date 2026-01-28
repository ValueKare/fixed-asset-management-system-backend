import { pool as db } from "../Config/mysql.js";
import QRCode from "qrcode";
import PDFDocument from "pdfkit";

/**
 * Generate QR Code PDF for an Asset
 * Uses asset_key as QR value
 */
export const generateBarcode = async (req, res) => {
  try {
    const { assetKey } = req.params;

    /* ---------------------------------
       1️⃣ FETCH ASSET FROM MYSQL
    --------------------------------- */
    const [rows] = await db.query(
      `SELECT * FROM nbc_assets WHERE asset_key = ?`,
      [assetKey]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: "Asset not found"
      });
    }

    const asset = rows[0];

    /* ---------------------------------
       2️⃣ QR VALUE (STABLE IDENTIFIER)
    --------------------------------- */
    const qrValue = asset.asset_key; // can be 16-digit or ASSET_xxx

    if (!qrValue) {
      return res.status(400).json({
        message: "Invalid QR value for asset"
      });
    }

    /* ---------------------------------
       3️⃣ GENERATE QR IMAGE
    --------------------------------- */
    const qrPng = await QRCode.toBuffer(qrValue, {
      errorCorrectionLevel: "H", // hospital-grade reliability
      width: 250,
      margin: 2
    });

    /* ---------------------------------
       4️⃣ CREATE PDF
    --------------------------------- */
    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=asset-qr-${assetKey}.pdf`
    );

    doc.pipe(res);

    /* ---------------------------------
       5️⃣ PDF CONTENT
    --------------------------------- */
    doc.fontSize(16).text("Asset QR Code", { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(11);
    doc.text(`Asset Name       : ${asset.asset}`);
    doc.text(`Description      : ${asset.asset_description || "-"}`);
    doc.text(`Asset Key        : ${asset.asset_key}`);
    doc.text(`Cost Centre      : ${asset.cost_centre || "-"}`);
    doc.text(`Business Area    : ${asset.bus_A || "-"}`);
    doc.text(`Asset Class      : ${asset.class || "-"}`);

    doc.moveDown(2);

    doc.text("Scan QR Code Below", { align: "center" });
    doc.moveDown(1);

    doc.image(qrPng, {
      width: 180,
      align: "center"
    });

    doc.moveDown(1.5);
    doc.fontSize(9).text(
      "This QR code is used for asset identification and audit verification.",
      { align: "center" }
    );

    doc.end();

  } catch (err) {
    console.error("QR generation error:", err);
    res.status(500).json({
      message: "QR code generation failed",
      error: err.message
    });
  }
};
