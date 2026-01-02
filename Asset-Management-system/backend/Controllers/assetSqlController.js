import { pool as db } from "../Config/mysql.js";

// ------------------------------------
// Add Asset (INSERT)
// ------------------------------------
export const addAsset = async (req, res) => {
  try {
    const {
      class: assetClass,
      bus_A,
      cost_centre,
      sno,
      asset,
      asset_description,
      quantity,
      amount,
      dc_start,
      depky,
      use_percentage,
      CostOrder,
      planned_dep,
      CoCd,
      description,
      business_area
    } = req.body;

    const query = `
      INSERT INTO nbc_assets 
      (class, bus_A, cost_centre, sno, asset, asset_description, quantity, amount, dc_start, depky, use_percentage, CostOrder, planned_dep, CoCd, description, business_area)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      assetClass,
      bus_A,
      cost_centre,
      sno,
      asset,
      asset_description,
      quantity,
      amount,
      dc_start,
      depky,
      use_percentage,
      CostOrder,
      planned_dep,
      CoCd,
      description,
      business_area
    ];

    await db.query(query, values);

    res.status(201).json({ message: "Asset added successfully" });

  } catch (err) {
    console.error("Add Asset Error:", err);
    res.status(500).json({ message: "Failed to add asset" });
  }
};


// ------------------------------------
// Get All Assets (SELECT)
// ------------------------------------
export const allAssets = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM nbc_assets ORDER BY id DESC");
    res.status(200).json({ total: rows.length, data: rows });
  } catch (err) {
    console.error("Fetch Asset Error:", err);
    res.status(500).json({ message: "Failed to fetch assets" });
  }
};


// ------------------------------------
// Update Asset (UPDATE)
// ------------------------------------
export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;

    const fields = req.body;
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    if (keys.length === 0) {
      return res.status(400).json({ message: "No fields to update" });
    }

    const setQuery = keys.map(k => `${k} = ?`).join(", ");

    const query = `UPDATE assets SET ${setQuery} WHERE id = ?`;

    await db.query(query, [...values, id]);

    res.status(200).json({ message: "Asset updated successfully" });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: "Failed to update asset" });
  }
};


// ------------------------------------
// Delete Asset (DELETE)
// ------------------------------------
export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM assets WHERE id = ?", [id]);

    res.status(200).json({ message: "Asset deleted successfully" });

  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Failed to delete asset" });
  }
};


