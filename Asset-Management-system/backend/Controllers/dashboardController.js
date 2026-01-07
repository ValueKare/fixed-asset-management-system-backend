import Asset from "../Models/Asset.js";
import mongoose from "mongoose";

const asObjectIdIfValid = (value) => {
  if (!value) return null;
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  return null;
};

/**
 * GET /api/dashboard/summary
 * Total assets, maintenance, AMC/CMC due, utilization %
 */
export const getDashboardSummary = async (req, res) => {
  try {
    const scope = {};
    const rawHospitalId = req.auth?.hospitalId || req.query?.hospitalId;
    const hospitalId = asObjectIdIfValid(rawHospitalId);
    if (hospitalId) scope.hospitalId = hospitalId;

    const totalAssets = await Asset.countDocuments(scope);

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

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: "Alerts fetch failed", error });
  }
};



