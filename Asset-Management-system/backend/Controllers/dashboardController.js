import Asset from "../Models/Asset.js";
import mongoose from "mongoose";
import { pool } from "../Config/mysql.js";

const asObjectIdIfValid = (value) => {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  return null;
};

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const isNumericString = (v) => typeof v === "string" && /^\s*\d+(\.\d+)?\s*$/.test(v);

/**
 * GET /api/dashboard/summary
 * Total assets, maintenance, AMC/CMC due, utilization %
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const [mysqlCountRows] = await pool.query(
      "SELECT COUNT(*) AS mysqlTotal FROM nbc_assets"
    );
    const mysqlTotal = safeNumber(mysqlCountRows?.[0]?.mysqlTotal, 0);

    const scope = {};
    const rawHospitalId = req.auth?.hospitalId || req.query?.hospitalId;
    const hospitalId = asObjectIdIfValid(rawHospitalId);
    if (hospitalId) scope.hospitalId = hospitalId;

    const totalAssets = await Asset.countDocuments(scope);

    if (req.query?.debug === "1") {
      return res.json({
        debug: true,
        mongoTotalScoped: totalAssets,
        mysqlTotal
      });
    }

    // Fallback to MySQL if Mongo has no matching assets but SQL has data
    if (totalAssets === 0 && safeNumber(mysqlTotal, 0) > 0) {
      const [avgUseRows] = await pool.query(
        "SELECT AVG(CAST(use_percentage AS DECIMAL(10,2))) AS avgUse FROM nbc_assets WHERE use_percentage REGEXP '^[0-9]+(\\.[0-9]+)?$'"
      );
      const avgUse = avgUseRows?.[0]?.avgUse ?? 0;

      return res.json({
        totalAssets: safeNumber(mysqlTotal, 0),
        activeAssets: safeNumber(mysqlTotal, 0),
        underMaintenance: 0,
        scrappedAssets: 0,
        amcDue: 0,
        utilizationRate: Math.round(safeNumber(avgUse, 0))
      });
    }

    const activeAssets = await Asset.countDocuments({
      ...scope,
      status: "active",
      lifecycleStatus: { $ne: "scrapped" }
    });

    const underMaintenance = await Asset.countDocuments({
      ...scope,
      $or: [
        { utilizationStatus: "under_maintenance" },
        { status: "maintenance" }
      ]
    });

    const scrappedAssets = await Asset.countDocuments({
      ...scope,
      lifecycleStatus: "scrapped"
    });

    const amcDue = await Asset.countDocuments({
      ...scope,
      amcEndDate: {
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    const utilized = await Asset.countDocuments({
      ...scope,
      utilizationStatus: "in_use"
    });

    const utilizationRate =
      totalAssets === 0 ? 0 : Math.round((utilized / totalAssets) * 100);

    res.json({
      totalAssets,
      activeAssets,
      underMaintenance,
      scrappedAssets,
      amcDue,
      utilizationRate
    });
    
  } catch (error) {
    res.status(500).json({ message: "Dashboard summary failed", error });
  }
};

/**
 * GET /api/dashboard/assets-by-department
 * Pie chart
 */
export const assetsByDepartment = async (req, res) => {
  try {
    const [mysqlCountRows] = await pool.query(
      "SELECT COUNT(*) AS mysqlTotal FROM nbc_assets"
    );
    const mysqlTotal = safeNumber(mysqlCountRows?.[0]?.mysqlTotal, 0);

    // Fallback to MySQL when Mongo has no assets
    const mongoCount = await Asset.estimatedDocumentCount();
    if (mongoCount === 0 && mysqlTotal > 0) {
      const [rows] = await pool.query(
        "SELECT business_area, COUNT(*) AS assetCount FROM nbc_assets GROUP BY business_area ORDER BY assetCount DESC"
      );

      const data = (rows || []).map((r) => ({
        department: r.business_area || "Unassigned",
        assetCount: safeNumber(r.assetCount, 0)
      }));

      return res.json(data);
    }

    const rawHospitalId = req.auth?.hospitalId || req.query?.hospitalId;
    const hospitalId = asObjectIdIfValid(rawHospitalId);
    const matchStage = hospitalId ? [{ $match: { hospitalId } }] : [];

    const data = await Asset.aggregate([
      ...matchStage,
      {
        $group: {
          _id: "$departmentId",
          assetCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department"
        }
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 0,
          department: { $ifNull: ["$department.name", "Unassigned"] },
          assetCount: 1
        }
      }
    ]);

    if ((data?.length || 0) === 0 && mysqlTotal > 0) {
      const [rows] = await pool.query(
        "SELECT business_area, COUNT(*) AS assetCount FROM nbc_assets GROUP BY business_area ORDER BY assetCount DESC"
      );

      const fallback = (rows || []).map((r) => ({
        department: r.business_area || "Unassigned",
        assetCount: safeNumber(r.assetCount, 0)
      }));

      return res.json(fallback);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Department data failed", error });
  }
};

/**
 * GET /api/dashboard/utilization
 * Bar chart
 */
export const utilizationByDepartment = async (req, res) => {
  try {
    const [mysqlCountRows] = await pool.query(
      "SELECT COUNT(*) AS mysqlTotal FROM nbc_assets"
    );
    const mysqlTotal = safeNumber(mysqlCountRows?.[0]?.mysqlTotal, 0);

    // Fallback to MySQL when Mongo has no assets
    const mongoCount = await Asset.estimatedDocumentCount();
    if (mongoCount === 0 && mysqlTotal > 0) {
      const [rows] = await pool.query(
        `
        SELECT 
          COALESCE(business_area, 'Unassigned') AS department,
          ROUND(AVG(
            CASE 
              WHEN use_percentage REGEXP '^[0-9]+(\\.[0-9]+)?$' THEN CAST(use_percentage AS DECIMAL(10,2))
              ELSE NULL
            END
          ), 0) AS utilization
        FROM nbc_assets
        GROUP BY business_area
        ORDER BY utilization DESC
        `
      );

      const data = (rows || []).map((r) => ({
        department: r.department || "Unassigned",
        utilization: safeNumber(r.utilization, 0)
      }));

      return res.json(data);
    }

    const rawHospitalId = req.auth?.hospitalId || req.query?.hospitalId;
    const hospitalId = asObjectIdIfValid(rawHospitalId);
    const matchStage = hospitalId ? [{ $match: { hospitalId } }] : [];

    const data = await Asset.aggregate([
      ...matchStage,
      {
        $group: {
          _id: "$departmentId",
          total: { $sum: 1 },
          used: {
            $sum: {
              $cond: [{ $eq: ["$utilizationStatus", "in_use"] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department"
        }
      },
      {
        $unwind: {
          path: "$department",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          department: { $ifNull: ["$department.name", "Unassigned"] },
          utilization: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$used", "$total"] },
                  100
                ]
              },
              0
            ]
          }
        }
      }
    ]);

    if ((data?.length || 0) === 0 && mysqlTotal > 0) {
      const [rows] = await pool.query(
        `
        SELECT 
          COALESCE(business_area, 'Unassigned') AS department,
          ROUND(AVG(
            CASE 
              WHEN use_percentage REGEXP '^[0-9]+(\\.[0-9]+)?$' THEN CAST(use_percentage AS DECIMAL(10,2))
              ELSE NULL
            END
          ), 0) AS utilization
        FROM nbc_assets
        GROUP BY business_area
        ORDER BY utilization DESC
        `
      );

      const fallback = (rows || []).map((r) => ({
        department: r.department || "Unassigned",
        utilization: safeNumber(r.utilization, 0)
      }));

      return res.json(fallback);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Utilization failed", error });
  }
};

/**
 * GET /api/dashboard/cost-trends
 * Line chart
 */
export const costTrends = async (req, res) => {
  try {
    const [mysqlCountRows] = await pool.query(
      "SELECT COUNT(*) AS mysqlTotal FROM nbc_assets"
    );
    const mysqlTotal = safeNumber(mysqlCountRows?.[0]?.mysqlTotal, 0);

    // Fallback to MySQL when Mongo has no assets
    const mongoCount = await Asset.estimatedDocumentCount();
    if (mongoCount === 0 && mysqlTotal > 0) {
      const [rows] = await pool.query(
        `
        SELECT 
          MONTH(createdAt) AS month,
          SUM(COALESCE(amount, 0)) AS cost
        FROM nbc_assets
        GROUP BY MONTH(createdAt)
        ORDER BY month ASC
        `
      );

      const data = (rows || []).map((r) => ({
        month: safeNumber(r.month, 0),
        cost: safeNumber(r.cost, 0),
        maintenance: 0
      }));

      return res.json(data);
    }

    const rawHospitalId = req.auth?.hospitalId || req.query?.hospitalId;
    const hospitalId = asObjectIdIfValid(rawHospitalId);
    const matchStage = hospitalId ? [{ $match: { hospitalId } }] : [];

    const data = await Asset.aggregate([
      ...matchStage,
      {
        $group: {
          _id: { $month: "$createdAt" },
          cost: { $sum: "$purchaseCost" },
          maintenance: { $sum: "$maintenanceCost" }
        }
      },
      { $sort: { "_id": 1 } },
      {
        $project: {
          month: "$_id",
          cost: 1,
          maintenance: 1,
          _id: 0
        }
      }
    ]);

    if ((data?.length || 0) === 0 && mysqlTotal > 0) {
      const [rows] = await pool.query(
        `
        SELECT 
          MONTH(createdAt) AS month,
          SUM(COALESCE(amount, 0)) AS cost
        FROM nbc_assets
        GROUP BY MONTH(createdAt)
        ORDER BY month ASC
        `
      );

      const fallback = (rows || []).map((r) => ({
        month: safeNumber(r.month, 0),
        cost: safeNumber(r.cost, 0),
        maintenance: 0
      }));

      return res.json(fallback);
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Cost trends failed", error });
  }
};

/**
 * GET /api/dashboard/alerts
 * AMC / Maintenance alerts
 */
export const dashboardAlerts = async (req, res) => {
  try {
    const [mysqlCountRows] = await pool.query(
      "SELECT COUNT(*) AS mysqlTotal FROM nbc_assets"
    );
    const mysqlTotal = safeNumber(mysqlCountRows?.[0]?.mysqlTotal, 0);

    // Fallback to MySQL when Mongo has no assets
    const mongoCount = await Asset.estimatedDocumentCount();
    if (mongoCount === 0 && mysqlTotal > 0) {
      const [rows] = await pool.query(
        "SELECT asset_description, business_area, createdAt FROM nbc_assets ORDER BY createdAt DESC LIMIT 5"
      );

      const alerts = (rows || []).map((r) => ({
        assetName: r.asset_description || "Unknown",
        department: r.business_area || "Unassigned",
        createdAt: r.createdAt || null
      }));

      return res.json(alerts);
    }

    const scope = {};
    const rawHospitalId = req.auth?.hospitalId || req.query?.hospitalId;
    const hospitalId = asObjectIdIfValid(rawHospitalId);
    if (hospitalId) scope.hospitalId = hospitalId;

    const alerts = await Asset.find({
      ...scope,
      $or: [
        {
          amcEndDate: {
            $lte: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
          }
        },
        { utilizationStatus: "under_maintenance" }
      ]
    })
      .limit(5)
      .select("assetName departmentId amcEndDate utilizationStatus")
      .populate("departmentId", "name");

    if ((alerts?.length || 0) === 0 && mysqlTotal > 0) {
      const [rows] = await pool.query(
        "SELECT asset_description, business_area, createdAt FROM nbc_assets ORDER BY createdAt DESC LIMIT 5"
      );

      const fallback = (rows || []).map((r) => ({
        assetName: r.asset_description || "Unknown",
        department: r.business_area || "Unassigned",
        createdAt: r.createdAt || null
      }));

      return res.json(fallback);
    }

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Alerts fetch failed", error });
  }
};



