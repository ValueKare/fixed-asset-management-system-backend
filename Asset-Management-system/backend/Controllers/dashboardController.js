import Asset from "../Models/Asset.js";
import mongoose from "mongoose";
import { pool } from "../Config/mysql.js";
import Hospital from "../Models/Hospital.js";
import Entity from "../Models/Entity.js";

const asObjectIdIfValid = (value) => {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  return null;
};

const getHospitalIdFromCode = async (hospitalCode) => {
  if (!hospitalCode) return null;
  
  // If it's already a valid ObjectId, return it
  if (mongoose.Types.ObjectId.isValid(hospitalCode)) {
    return new mongoose.Types.ObjectId(hospitalCode);
  }
  
  // Otherwise, treat it as a hospital code and find hospital
  try {
    console.log("🔍 Debug - Searching for hospital with code:", hospitalCode);
    const hospital = await Hospital.findOne({ hospitalId: hospitalCode });
    console.log("🔍 Debug - Found hospital:", hospital);
    // Return the hospital's ObjectId as string to match Asset collection
    return hospital ? hospital._id : null;
  } catch (error) {
    console.error("🔍 Debug - Error finding hospital:", error);
    return null;
  }
};

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const isNumericString = (v) => typeof v === "string" && /^\s*\d+(\.\d+)?\s*$/.test(v);

/**
 * GET /api/dashboard/hospitals
 * List all available hospitals for debugging
 */
export const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find().select('entityCode name location _id');
    console.log("🔍 Debug - All hospitals:", hospitals);
    res.json({
      success: true,
      data: hospitals
    });
  } catch (error) {
    console.error("🔍 Debug - Error fetching hospitals:", error);
    res.status(500).json({ 
      message: "Failed to fetch hospitals", 
      error: error.message 
    });
  }
};

/**
 * GET /api/dashboard/summary
 * Total assets, maintenance, AMC/CMC due, utilization %
 */
export const getDashboardSummary = async (req, res) => {
  try {
    // 1. Resolve hospital scope
    const rawHospitalId = req.auth?.hospitalId || req.query?.hospitalId;

    const hospitalId = await getHospitalIdFromCode(rawHospitalId);

    // 2. Build MongoDB scope (IMPORTANT: ObjectId only)
    const scope = {};
    if (hospitalId) {
      scope.hospitalId = hospitalId; // ✅ ObjectId
    }

    // 3. Total assets
    const totalAssets = await Asset.countDocuments(scope);

    // Debug-only response
    if (req.query?.debug === "1") {
      return res.json({
        debug: true,
        rawHospitalId,
        resolvedHospitalId: hospitalId,
        mongoScope: scope,
        totalAssets
      });
    }

    // 4. Active assets
    const activeAssets = await Asset.countDocuments({
      ...scope,
      status: "active",
      lifecycleStatus: { $ne: "scrapped" }
    });

    // 5. Under maintenance
    const underMaintenance = await Asset.countDocuments({
      ...scope,
      $or: [
        { utilizationStatus: "under_maintenance" },
        { status: "maintenance" }
      ]
    });

    // 6. Scrapped assets
    const scrappedAssets = await Asset.countDocuments({
      ...scope,
      lifecycleStatus: "scrapped"
    });

    // 7. AMC due in next 30 days
    const amcDue = await Asset.countDocuments({
      ...scope,
      amcEndDate: {
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // 8. Utilized assets
    const utilizedAssets = await Asset.countDocuments({
      ...scope,
      utilizationStatus: "in_use"
    });

    // 9. Utilization rate
    const utilizationRate =
      totalAssets === 0
        ? 0
        : Math.round((utilizedAssets / totalAssets) * 100);

    // 10. Hospital info (only if scoped)
    let hospitalInfo = null;
    if (hospitalId) {
      hospitalInfo = await Hospital.findById(hospitalId)
        .select("hospitalId name location entityId");
    }

    // 11. Final response
    return res.json({
      scope: hospitalId ? "hospital" : "global",
      hospitalInfo,
      totalAssets,
      activeAssets,
      underMaintenance,
      scrappedAssets,
      amcDue,
      utilizationRate
    });

  } catch (error) {
    console.error("Dashboard summary error:", error);
    return res.status(500).json({
      message: "Dashboard summary failed",
      error: error.message
    });
  }
};

/**
 * GET /api/dashboard/assets-by-department
 * Pie chart
 */
export const assetsByDepartment = async (req, res) => {
  try {
    // 1. Resolve hospital scope
    const rawHospitalId = req.auth?.hospitalId || req.query?.hospitalId;
    const hospitalId = await getHospitalIdFromCode(rawHospitalId);

    // 2. Build MongoDB scope (ObjectId only)
    const scope = {};
    if (hospitalId) {
      scope.hospitalId = hospitalId;
    }

    // 3. Get assets by department using MongoDB aggregation
    const data = await Asset.aggregate([
      { $match: scope },
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
      },
      { $sort: { assetCount: -1 } }
    ]);

    res.json(data);
  } catch (error) {
    console.error("Assets by department error:", error);
    res.status(500).json({ 
      message: "Department data failed", 
      error: error.message 
    });
  }
};

/**
 * GET /api/dashboard/utilization
 * Bar chart
 */
export const utilizationByDepartment = async (req, res) => {
  try {
    // 1. Resolve hospital scope
    const rawHospitalId = req.auth?.hospitalId || req.query?.hospitalId;
    const hospitalId = await getHospitalIdFromCode(rawHospitalId);

    // 2. Build MongoDB scope (ObjectId only)
    const scope = {};
    if (hospitalId) {
      scope.hospitalId = hospitalId;
    }

    // 3. Get utilization by department using MongoDB aggregation
    const data = await Asset.aggregate([
      { $match: scope },
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
          _id: 0,
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
      },
      { $sort: { utilization: -1 } }
    ]);

    res.json(data);
  } catch (error) {
    console.error("Utilization by department error:", error);
    res.status(500).json({ 
      message: "Utilization failed", 
      error: error.message 
    });
  }
};

/**
 * GET /api/dashboard/cost-trends
 * Line chart
 */
export const costTrends = async (req, res) => {
  try {
    // 1. Resolve hospital scope
    const rawHospitalId = req.auth?.hospitalId || req.query?.hospitalId;
    const hospitalId = await getHospitalIdFromCode(rawHospitalId);

    // 2. Build MongoDB scope (ObjectId only)
    const scope = {};
    if (hospitalId) {
      scope.hospitalId = hospitalId;
    }

    // 3. Get cost trends by month using MongoDB aggregation
    const data = await Asset.aggregate([
      { $match: scope },
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

    res.json(data);
  } catch (error) {
    console.error("Cost trends error:", error);
    res.status(500).json({ 
      message: "Cost trends failed", 
      error: error.message 
    });
  }
};

/**
 * GET /api/dashboard/hospitals
 * Get hospital count and list with optional entity filtering
 */
export const getHospitalsByEntity = async (req, res) => {
  try {
    const { entityCode } = req.query;
    
    if (entityCode) {
      // Entity-specific: Find entity by code, then hospitals by entity ID
      const entity = await Entity.findOne({ code: entityCode });
      if (!entity) {
        return res.status(404).json({ 
          success: false,
          message: "Entity not found" 
        });
      }
      
      const hospitals = await Hospital.find({ entityId: entity._id })
        .select('hospitalId name location contactEmail')
        .sort({ name: 1 });
      
      return res.json({
        success: true,
        count: hospitals.length,
        scope: "entity",
        entityCode,
        entityName: entity.name,
        hospitals
      });
    } else {
      // Global: All hospitals
      const hospitals = await Hospital.find()
        .select('hospitalId name location contactEmail')
        .sort({ name: 1 });
      
      return res.json({
        success: true,
        count: hospitals.length,
        scope: "global",
        hospitals
      });
    }
  } catch (error) {
    console.error("Get hospitals error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to get hospitals", 
      error: error.message 
    });
  }
};
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



