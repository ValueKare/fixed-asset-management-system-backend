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


// ------------------------------------
// Get Paginated Assets (SELECT with pagination)
// ------------------------------------
export const getPaginatedAssets = async (req, res) => {
  try {
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereClause = "WHERE 1=1";
    const params = [];
    
    if (search) {
      whereClause += " AND (asset_description LIKE ? OR asset LIKE ? OR sno LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      whereClause += " AND status = ?";
      params.push(status);
    }
    
    // Get total count for pagination info
    const countQuery = `SELECT COUNT(*) as total FROM nbc_assets ${whereClause}`;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;
    
    // Get paginated data
    const dataQuery = `
      SELECT * FROM nbc_assets 
      ${whereClause} 
      ORDER BY id DESC 
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await db.query(dataQuery, [...params, limit, offset]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      }
    });
    
  } catch (err) {
    console.error("Paginated Assets Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch paginated assets" 
    });
  }
};


