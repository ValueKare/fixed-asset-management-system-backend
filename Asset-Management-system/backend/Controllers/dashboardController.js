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

/**
 * GET /api/dashboard/alerts
 * Get alerts with comprehensive asset information
 */
export const dashboardAlerts = async (req, res) => {
  try {
    // 1. Resolve hospital scope
    const rawHospitalId = req.auth?.hospitalId || req.query?.hospitalId;
    const hospitalId = await getHospitalIdFromCode(rawHospitalId);

    // 2. Build MongoDB scope
    const scope = {};
    if (hospitalId) {
      scope.hospitalId = hospitalId;
    }

    // 3. Time window for AMC alerts (30 days)
    const today = new Date();
    const amcThresholdDate = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    // 4. Fetch alert-worthy assets
    const alerts = await Asset.find({
      ...scope,
      $or: [
        { amcEndDate: { $lte: amcThresholdDate } },
        { utilizationStatus: "under_maintenance" }
      ]
    })
      .sort({ amcEndDate: 1 }) // nearest expiry first
      .limit(5)
      .select(
        "assetName assetCode hospitalId departmentId buildingId floorId amcEndDate utilizationStatus status purchaseCost maintenanceCost"
      )
      .populate([
        { path: "hospitalId", select: "name location" },
        { path: "departmentId", select: "name" },
        { path: "buildingId", select: "name" },
        { path: "floorId", select: "name" }
      ]);

    // 5. Format alerts correctly
    const formattedAlerts = alerts.map(asset => {
      const isAmcDue =
        asset.amcEndDate && asset.amcEndDate <= amcThresholdDate;

      const daysToExpiry = asset.amcEndDate
        ? Math.max(
            0,
            Math.ceil(
              (new Date(asset.amcEndDate) - today) /
                (1000 * 60 * 60 * 24)
            )
          )
        : null;

      return {
        assetName: asset.assetName || "Unknown",
        assetCode: asset.assetCode || "N/A",

        hospitalName: asset.hospitalId?.name || "Unknown Hospital",
        hospitalLocation:
          asset.hospitalId?.location || "Unknown Location",

        departmentName:
          asset.departmentId?.name || "Unassigned",
        buildingName: asset.buildingId?.name || "N/A",
        floorName: asset.floorId?.name || "N/A",

        amcExpiryDate: asset.amcEndDate || null,
        utilizationStatus:
          asset.utilizationStatus || "unknown",
        status: asset.status || "unknown",

        purchaseCost: asset.purchaseCost || 0,
        maintenanceCost: asset.maintenanceCost || 0,

        alertType: isAmcDue
          ? "AMC Due"
          : "Under Maintenance",

        daysToExpiry
      };
    });

    // 6. Send response
    res.json({
      success: true,
      count: formattedAlerts.length,
      scope: hospitalId ? "hospital" : "global",
      alerts: formattedAlerts
    });
  } catch (error) {
    console.error("Dashboard alerts error:", error);
    res.status(500).json({
      success: false,
      message: "Alerts fetch failed",
      error: error.message
    });
  }
};

