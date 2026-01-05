import { pool } from "../Config/mysql.js";

/**
 * Dashboard Summary
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const [[total]] = await pool.query(
      "SELECT COUNT(*) AS totalAssets FROM hospital_assets"
    );

    const [status] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM hospital_assets
      GROUP BY status
    `);

    res.json({
      totalAssets: total.totalAssets,
      statusBreakdown: status
    });
  } catch (error) {
    res.status(500).json({ message: "Dashboard error", error: error.message });
  }
};

/**
 * Assets by Department
 */
export const assetsByDepartment = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT department, COUNT(*) as count
      FROM hospital_assets
      GROUP BY department
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};
