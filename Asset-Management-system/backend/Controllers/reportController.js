// backend/Controllers/reportController.js

// backend/Controllers/reportController.js

import Request from "../Models/Request.js";
import Asset from "../Models/Asset.js";

/**
 * 📊 Get summary of all requests (Admin Only)
 */
export const getRequestsSummary = async (req, res, next) => {
  try {
    const summary = await Request.aggregate([
      {
        $group: {
          _id: { category: "$asset_category", status: "$status" },
          total: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.category",
          statuses: {
            $push: { status: "$_id.status", count: "$total" },
          },
          totalRequests: { $sum: "$total" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          statuses: 1,
          totalRequests: 1,
        },
      },
    ]);

    res.status(200).json({
      message: "Request summary fetched successfully",
      summary,
    });
  } catch (error) {
    console.error("Error fetching request summary:", error);
    next(error);
  }
};

/**
 * 🏥 Department Summary (HOD)
 */
export const getDepartmentSummary = async (req, res, next) => {
  try {
    const department = req.user?.department || req.query.department;
    if (!department) {
      return res
        .status(400)
        .json({ message: "Department information is required" });
    }

    const summary = await Request.aggregate([
      { $match: { department } },
      {
        $group: {
          _id: "$status",
          totalRequests: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          totalRequests: 1,
        },
      },
    ]);

    res.status(200).json({ department, summary });
  } catch (error) {
    console.error("Error fetching department summary:", error);
    next(error);
  }
};

/**
 * 🧾 Asset usage report (Admin)
 */
export const getAssetUsageReport = async (req, res, next) => {
  try {
    const totalAssets = await Asset.countDocuments();
    const assignedAssets = await Asset.countDocuments({ isAssigned: true });
    const availableAssets = totalAssets - assignedAssets;

    res.status(200).json({
      totalAssets,
      assignedAssets,
      availableAssets,
      message: "Asset usage report generated successfully",
    });
  } catch (error) {
    console.error("Error generating asset usage report:", error);
    next(error);
  }
};

/**
 * 🕵️‍♂️ Audit Report (Admin)
 */
export const getAuditReport = async (req, res, next) => {
  try {
    // For now, using dummy data. Later, we’ll connect this to a real AuditLog model.
    const logs = [
      {
        action: "Asset Assigned",
        user: "Admin",
        timestamp: new Date(),
        details: "Assigned MRI-102 to Employee E001",
      },
      {
        action: "Request Approved",
        user: "HOD",
        timestamp: new Date(),
        details: "Approved wheelchair request for Orthopedics",
      },
    ];

    res.status(200).json({
      message: "Audit report fetched successfully",
      total: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Error fetching audit report:", error);
    next(error);
  }
};
