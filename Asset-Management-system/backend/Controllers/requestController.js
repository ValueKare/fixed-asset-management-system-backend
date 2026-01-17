// backend/Controllers/requestController.js

import Request from "../Models/Request.js";
import logger from "../Utils/logger.js";
import mongoose from "mongoose";
import Asset from "../Models/Asset.js";
import Entity from "../Models/Entity.js";
import Department from "../Models/Department.js";

// Helper function to convert string ID to ObjectId if needed
const toObjectId = (id) => {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) 
    ? new mongoose.Types.ObjectId(id) 
    : id;
};

/**
 * Approver levels in correct order.
 * Workflow:
 *  Level1 → Level2 → Level3 → HOD → Inventory → Purchase → Budget → CFO
 */
// backend/Controllers/requestController.js


/* ================= APPROVAL FLOW CONFIG ================= */

const APPROVAL_FLOW = [
  "level1",
  "level2",
  "level3",
  "hod",
  "inventory",
  "purchase",
  "budget",
  "cfo"
];

const ROLE_TO_LEVEL = {
  supervisor: "level1",
  manager: "level2",
  operations: "level3",
  hod: "hod",
  inventory: "inventory",
  purchase: "purchase",
  budget: "budget",
  cfo: "cfo"
};
/**
 * Get next approval stage
 */
const getNextLevel = (currentLevel) => {
  const idx = APPROVAL_FLOW.indexOf(currentLevel);
  if (idx === -1 || idx === APPROVAL_FLOW.length - 1) {
    return "completed";
  }
  return APPROVAL_FLOW[idx + 1];
};
/**
 * Create a new request (Employee or HOD)
 */
// export const createRequest = async (req, res, next) => {
//   try {
//     const {
//       assetCategory,
//       assetName,
//       quantity,
//       department,
//       priority,
//       justification,
//       estimatedCost,
//       meta,
//     } = req.body;

//     if (!assetCategory || !assetName || !quantity || !department || !justification) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     const newRequest = await Request.create({
//       requestedBy: new mongoose.Types.ObjectId(), // Generate valid ObjectId for testing
//       requestType: "procurement", // Required field
//       assetCategory,
//       assetName,
//       quantity,
//       department,
//       priority: priority || "medium",
//       justification,
//       estimatedCost: estimatedCost || 0,
//       meta: meta || {},
//       currentLevel: "level1",
//       finalStatus: "pending",
//     });
//     logger.info(
//   `REQUEST_CREATED | requestId=${newRequest._id} | asset=${assetName} | qty=${quantity} | dept=${department} | by=temp_user`
// );


//     res.status(201).json({
//       message: "Request created successfully",
//       request: newRequest,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// POST /api/requests
// backend/Controllers/requestController.js

export const createRequest = async (req, res) => {
  try {
    const {
      requestType,
      assetCategory,
      assetName,
      requestedCount,
      justification,
      priority,
      estimatedCost,
      meta,
      targetHospitalId // OPTIONAL (for cross-hospital transfer)
    } = req.body;

    // 🔒 Basic validation
    if (
      !requestType ||
      !assetCategory ||
      !assetName ||
      !requestedCount ||
      !justification
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // 🔒 Department must come from logged-in employee
    if (!req.user.department) {
      return res.status(400).json({
        success: false,
        message: "Employee department not linked"
      });
    }

    // 🔁 Cross-hospital logic
    const isCrossHospital =
      targetHospitalId &&
      targetHospitalId !== req.user.hospital;

    // 🔢 Initial approval level
    const initialLevel = isCrossHospital ? "level3" : "level1";

    // Ensure hospitalId exists for request creation
    if (!req.user.hospital) {
      return res.status(400).json({ 
        success: false,
        message: "Hospital ID is required for creating requests. Please login with hospital-specific credentials." 
      });
    }

    // Convert organization string to ObjectId if needed
    let organizationId = req.auth.organizationId;
    if (typeof req.auth.organizationId === 'string') {
      const entity = await Entity.findOne({ code: req.auth.organizationId });
      if (entity) {
        organizationId = entity._id;
      } else {
        return res.status(400).json({ 
          success: false,
          message: "Invalid organization code" 
        });
      }
    }

    const request = await Request.create({
      requestedBy: req.user._id,

      requestType,
      assetCategory,
      assetName,

      fulfillment: {
        requestedCount,
        fulfilledCount: 0,
        fulfilledAssets: []
      },

      justification,
      estimatedCost: estimatedCost || 0,
      priority: priority || "medium",

      scope: {
        level: "department",
        departmentId: req.user.department,
        hospitalId: req.user.hospital,
        organizationId
      },

      currentLevel: initialLevel,
      finalStatus: "pending",

      escalation: {
        enabled: true,
        escalateAfterHours: 24,
        lastActionAt: new Date()
      },

      meta: meta || {}
    });

    return res.status(201).json({
      success: true,
      message: "Request created successfully",
      data: request
    });

  } catch (error) {
    console.error("Create request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create request"
    });
  }
};

// backend/Controllers/requestController.js

export const getOpenRequests = async (req, res) => {
  try {
    // 🔒 Permission check
    if (!req.auth?.permissions?.asset?.transfer) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to fulfill asset requests"
      });
    }

    const hospitalId = req.user.hospital;

    // 🔍 Debug query construction
    console.log("🔍 getOpenRequests Debug:");
    console.log("  - User hospitalId:", hospitalId);
    console.log("  - User permissions:", req.auth?.permissions);

    // 🔍 Fetch open requests
    const query = {
      finalStatus: "pending",
      $or: [
        // Same hospital requests at any approval level
        { "scope.hospitalId": hospitalId },
        
        // Cross-hospital requests escalated to level3
        {
          "scope.hospitalId": { $ne: hospitalId },
          currentLevel: "level3"
        }
      ]
    };
    
    console.log("  - Query:", JSON.stringify(query, null, 2));
    
    const requests = await Request.find(query)
      .populate("requestedBy", "name role")
      .populate("scope.departmentId", "name code")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });

  } catch (error) {
    console.error("Get open requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch open requests"
    });
  }
};

/**
 * Get logged-in employee's own requests
 */
export const getMyRequests = async (req, res, next) => {
  try {
    const myRequests = await Request.find({ requestedBy: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json(myRequests);
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single request with full approval history
 */
// export const getRequestById = async (req, res, next) => {
//   try {
//     const request = await Request.findById(req.params.id)
//       .populate("requestedBy", "name email role")
//       .populate("approvalFlow.level1.approvedBy", "name email role")
//       .populate("approvalFlow.level2.approvedBy", "name email role")
//       .populate("approvalFlow.level3.approvedBy", "name email role")
//       .populate("approvalFlow.hod.approvedBy", "name email role")
//       .populate("approvalFlow.inventory.approvedBy", "name email role")
//       .populate("approvalFlow.purchase.approvedBy", "name email role")
//       .populate("approvalFlow.budget.approvedBy", "name email role")
//       .populate("approvalFlow.cfo.approvedBy", "name email role");

//     if (!request) return res.status(404).json({ message: "Request not found" });

//     res.status(200).json(request);
//   } catch (err) {
//     next(err);
//   }
// };
// GET /api/requests/:id
export const getRequestById = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("requestedBy", "name email role")
      .populate("approvalFlow.level1.approvedBy", "name role")
      .populate("approvalFlow.level2.approvedBy", "name role")
      .populate("approvalFlow.level3.approvedBy", "name role")
      .populate("approvalFlow.hod.approvedBy", "name role")
      .populate("approvalFlow.inventory.approvedBy", "name role")
      .populate("approvalFlow.purchase.approvedBy", "name role")
      .populate("approvalFlow.budget.approvedBy", "name role")
      .populate("approvalFlow.cfo.approvedBy", "name role");

    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json(request);
  } catch (err) {
    next(err);
  }
};

/**
 * Get pending requests for logged-in approver
 */
// export const getPendingForMe = async (req, res, next) => {
//   try {
//     const role = req.user.role;

//     if (!APPROVAL_FLOW.includes(role)) {
//       return res.status(403).json({ message: "Not part of approval workflow" });
//     }

//     const pending = await Request.find({
//       currentLevel: role,
//       finalStatus: "pending",
//     })
//       .sort({ createdAt: 1 })
//       .populate("requestedBy", "name email role");

//     res.status(200).json(pending);
//   } catch (err) {
//     next(err);
//   }
// };
// GET /api/requests/pending
export const getPendingForMe = async (req, res, next) => {
  try {
    const level = ROLE_TO_LEVEL[req.user.role];
    if (!level) {
      return res.status(403).json({ message: "Not an approver role" });
    }

    const pending = await Request.find({
      currentLevel: level,
      finalStatus: "pending",
      "scope.organizationId": req.auth.organizationId
    })
      .populate("requestedBy", "name email role")
      .sort({ createdAt: 1 });

    res.json(pending);
  } catch (err) {
    next(err);
  }
};

/**
 * Approve Request (Level1 → Level2 → ... → CFO)
 */
// export const approveRequest = async (req, res, next) => {
//   try {
//     const { remarks } = req.body;
//     const request = await Request.findById(req.params.id);

//     if (!request) return res.status(404).json({ message: "Request not found" });

//     const currentRole = req.user.role;
// if (request.currentLevel !== currentRole) {
//   logger.warn(
//     `UNAUTHORIZED_APPROVAL | requestId=${request._id} | attemptedBy=${req.user.id} | role=${currentRole} | expected=${request.currentLevel}`
//   );

//   return res.status(403).json({
//     message: `You cannot approve at this stage. Current stage: ${request.currentLevel}`,
//   });
// }

//     // Mark this stage as approved
//     request.approvalFlow[currentRole] = {
//       status: "approved",
//       approvedBy: req.user.id,
//       date: new Date(),
//       remarks: remarks || "",
//     };

//     const nextLevel = getNextLevel(currentRole);
//     request.currentLevel = nextLevel;

//     // If CFO → Final approval
//     if (nextLevel === "completed") {
//       request.finalStatus = "approved";
//     }

//     await request.save();

//     res.status(200).json({
//       message: "Request approved",
//       request,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
// POST /api/requests/:id/approve
export const approveRequest = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const level = ROLE_TO_LEVEL[req.user.role];
    if (request.currentLevel !== level) {
      return res.status(403).json({
        message: `Approval not allowed at stage ${request.currentLevel}`
      });
    }

    // scope enforcement
    if (
      request.scope.organizationId.toString() !==
      req.auth.organizationId.toString()
    ) {
      return res.status(403).json({ message: "Out of scope approval" });
    }

    // record approval
    request.approvalFlow[level] = {
      status: "approved",
      approvedBy: req.user._id,
      date: new Date(),
      remarks: req.body.remarks || ""
    };

    request.escalation.lastActionAt = new Date();

    // asset transfer stays at same level
    if (request.requestType !== "asset_transfer") {
      const nextLevel = getNextLevel(level);
      request.currentLevel = nextLevel;

      if (nextLevel === "completed") {
        request.finalStatus = "approved";
      }
    }

    await request.save();
    res.json({ message: "Request approved", request });
  } catch (err) {
    next(err);
  }
};

/**
 * Reject Request (any approver)
 */
// export const rejectRequest = async (req, res, next) => {
//   try {
//     const { remarks } = req.body;
//     const request = await Request.findById(req.params.id);

//     if (!request) return res.status(404).json({ message: "Request not found" });

//     const currentRole = req.user.role;

//    if (request.currentLevel !== currentRole) {
//   logger.warn(
//     `UNAUTHORIZED_REJECT | requestId=${request._id} | attemptedBy=${req.user.id} | role=${currentRole} | expected=${request.currentLevel}`
//   );

//   return res.status(403).json({
//     message: `You cannot reject at this stage. Current stage: ${request.currentLevel}`,
//   });
// }
//     request.approvalFlow[currentRole] = {
//       status: "rejected",
//       approvedBy: req.user.id,
//       date: new Date(),
//       remarks: remarks || "",
//     };

//     request.finalStatus = "rejected";
//     request.currentLevel = "rejected";

//     await request.save();

//     logger.info(
//   `REQUEST_REJECTED | requestId=${request._id} | level=${currentRole} | by=${req.user.id} | remarks=${remarks || "NA"}`
// );


//     res.status(200).json({
//       message: "Request rejected",
//       request,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
// POST /api/requests/:id/reject
export const rejectRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { remarks } = req.body;

    // Support both requestId and id parameter names
    const id = requestId || req.params.id;
    const request = await Request.findById(id);
    if (!request || request.finalStatus !== "pending") {
      return res.status(404).json({ message: "Request not found or already closed" });
    }

    // Hospital isolation - Use req.user.hospital instead of req.auth.hospitalId
    if (String(request.scope.hospitalId) !== String(req.user.hospital)) {
      return res.status(403).json({ message: "Cross-hospital access denied" });
    }

    // Fetch reserved assets and release them
    const reservedAssets = await Asset.find({
      "reservation.requestId": request._id
    });

    for (const asset of reservedAssets) {
      asset.reservation = {
        isReserved: false,
        requestId: null,
        reservedByDepartmentId: null,
        reservedAt: null
      };
      await asset.save();
    }

    // Mark current approval level as rejected
    const level = ROLE_TO_LEVEL[req.user.role];
    if (request.currentLevel !== level) {
      return res.status(403).json({ message: "Not allowed at this stage" });
    }

    request.approvalFlow[level] = {
      status: "rejected",
      approvedBy: req.user._id,
      date: new Date(),
      remarks: remarks || "Rejected"
    };

    // Mark request rejected
    request.finalStatus = "rejected";
    request.currentLevel = "rejected";
    request.escalation.lastActionAt = new Date();

    // Optional audit note
    request.meta = {
      ...request.meta,
      rejectionRemarks: remarks || "Rejected"
    };

    await request.save();

    res.status(200).json({
      success: true,
      message: "Request rejected and assets released",
      releasedAssets: reservedAssets.length,
      request
    });
  } catch (err) {
    console.error("rejectRequest error:", err);
    res.status(500).json({ message: "Failed to reject request" });
  }
};

export const rejectRequestAssets = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { assetIds, remarks } = req.body;

    if (!assetIds || assetIds.length === 0) {
      return res.status(400).json({ message: "No assets specified" });
    }

    const request = await Request.findById(requestId);
    if (!request || request.finalStatus !== "pending") {
      return res.status(404).json({ message: "Invalid or closed request" });
    }

    // Hospital isolation - Use req.user.hospital instead of req.auth.hospitalId
    if (String(request.scope.hospitalId) !== String(req.user.hospital)) {
      return res.status(403).json({ message: "Cross-hospital access denied" });
    }

    // Fetch only selected assets
    const assets = await Asset.find({
      _id: { $in: assetIds },
      "reservation.requestId": request._id
    });

    // Initialize rejectedAssets array if it doesn't exist
    if (!request.rejectedAssets) {
      request.rejectedAssets = [];
    }

    // Release selected assets and track rejection
    for (const asset of assets) {
      const originalDepartmentId = asset.currentDepartmentId;
      
      asset.reservation = {
        isReserved: false,
        requestId: null,
        reservedByDepartmentId: null,
        reservedAt: null
      };
      await asset.save();

      // Track rejection in rejectedAssets array
      request.rejectedAssets.push({
        assetId: asset._id,
        fromDepartmentId: originalDepartmentId,
        rejectedAt: new Date(),
        rejectedBy: req.user._id,
        remarks
      });
    }

    // If all requested assets are resolved → close request
    const totalRequested = request.requestedAssets ? 
      request.requestedAssets.length : 
      request.fulfillment.requestedCount;
    
    const resolvedCount = request.fulfillment.fulfilledAssets.length;
    if (resolvedCount >= totalRequested) {
      request.currentLevel = "completed";
      request.finalStatus = "approved"; // All assets processed
    }

    request.escalation.lastActionAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: "Assets rejected successfully",
      rejectedAssets: assets.length,
      request
    });
  } catch (err) {
    console.error("rejectRequestAssets error:", err);
    res.status(500).json({ message: "Failed to reject assets" });
  }
};

/**
 * Admin: Get all requests
 */
export const getAllRequests = async (req, res, next) => {
  try {
    const all = await Request.find()
      .populate("requestedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(all);
  } catch (err) {
    next(err);
  }
};

/**
 * Get departments with available assets
 */
export const getDepartmentsWithAssets = async (req, res) => {
  try {
    const hospitalId = req.user.hospital; // Use user.hospital instead of auth.hospitalId

    console.log("🔍 getDepartmentsWithAssets Debug:");
    console.log("  - User hospitalId:", hospitalId);
    console.log("  - User permissions:", req.auth?.permissions);

    const departments = await Department.find({
      hospitalId: toObjectId(req.user.hospital)  // Convert to ObjectId
    }).select("_id name code");
    
    console.log("  - Departments found:", departments.length);
    console.log("  - Departments query:", JSON.stringify({ hospitalId }, null, 2));
    console.log("  - Departments data:", departments.map(d => ({ id: d._id, name: d.name, code: d.code })));

    const result = [];

    for (const dept of departments) {
      const assetQuery = {
        hospitalId: toObjectId(req.user.hospital),  // Convert to ObjectId
        currentDepartmentId: dept._id,
        status: "active",
        utilizationStatus: "not_in_use",
        "reservation.isReserved": false
      };
      
      const assetCount = await Asset.countDocuments(assetQuery);
      
      console.log(`  - Department ${dept.name} (${dept._id}): ${assetCount} assets`);

      if (assetCount > 0) {
        result.push({
          departmentId: dept._id,
          name: dept.name,
          code: dept.code,
          availableAssets: assetCount
        });
      }
    }

    console.log("  - Final result:", result);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error("getDepartmentsWithAssets error:", err);
    res.status(500).json({ success: false, message: "Failed to load departments" });
  }
};

/**
 * Get ideal assets for a specific department
 */
export const getDepartmentIdealAssets = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const assets = await Asset.find({
      hospitalId: toObjectId(req.user.hospital),
      currentDepartmentId: toObjectId(departmentId),
      status: "active",
      utilizationStatus: "not_in_use",
      "reservation.isReserved": false
    }).select("_id assetName assetCode barcode");

    res.json({
      success: true,
      data: assets
    });
  } catch (err) {
    console.error("getDepartmentIdealAssets error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch assets" });
  }
};

/**
 * Create request for specific assets
 */
export const createSpecificAssetRequest = async (req, res) => {
  try {
    // 🔐 Permission check
    if (!req.auth.permissions?.asset?.transfer) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to request asset transfers"
      });
    }

    const {
      requestType,
      assetCategory,
      assetName,
      requestedAssets,
      justification,
      priority
    } = req.body;

    if (!requestedAssets || requestedAssets.length === 0) {
      return res.status(400).json({ message: "No assets selected" });
    }

    // 1️⃣ Validate assets availability
    const assets = await Asset.find({
      _id: { $in: requestedAssets },
      hospitalId: req.user.hospital,
      status: "active",
      utilizationStatus: "not_in_use",
      "reservation.isReserved": false
    });

    if (assets.length !== requestedAssets.length) {
      return res.status(409).json({
        message: "Some assets are no longer available"
      });
    }

    // Convert organization string to ObjectId if needed
    let organizationId = req.auth.organizationId;
    if (typeof req.auth.organizationId === 'string') {
      const entity = await Entity.findOne({ code: req.auth.organizationId });
      if (entity) {
        organizationId = entity._id;
      } else {
        return res.status(400).json({ 
          success: false,
          message: "Invalid organization code" 
        });
      }
    }

    // 2️⃣ Create request
    const request = await Request.create({
      requestedBy: req.user._id,
      requestType: "asset_transfer",
      assetCategory,
      assetName,

      requestedAssets,

      justification,
      priority: priority || "medium",

      scope: {
        level: "department",
        departmentId: req.user.department,
        hospitalId: req.user.hospital,
        organizationId
      },

      currentLevel: "level1",
      finalStatus: "pending",

      escalation: {
        enabled: true,
        escalateAfterHours: 24,
        lastActionAt: new Date()
      }
    });

    // 3️⃣ 🔒 Reserve assets immediately
    await Asset.updateMany(
      { _id: { $in: requestedAssets } },
      {
        $set: {
          "reservation.isReserved": true,
          "reservation.requestId": request._id,
          "reservation.reservedByDepartmentId": req.user.department,
          "reservation.reservedAt": new Date()
        }
      }
    );

    return res.status(201).json({
      success: true,
      message: "Asset transfer request created and assets reserved",
      data: request
    });

  } catch (err) {
    console.error("createSpecificAssetRequest error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create asset request"
    });
  }
};

export const fulfillAssetRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { assetIds, remarks } = req.body;

    if (!assetIds || assetIds.length === 0) {
      return res.status(400).json({ message: "No assets provided" });
    }

    const request = await Request.findById(requestId);
    if (!request || request.finalStatus !== "pending") {
      return res.status(400).json({ message: "Invalid or closed request" });
    }

    // Hospital isolation - Use req.user.hospital instead of req.auth.hospitalId
    console.log("🔍 fulfillAssetRequest Debug:");
    console.log("  - Request scope.hospitalId:", request.scope.hospitalId);
    console.log("  - Request scope.hospitalId type:", typeof request.scope.hospitalId);
    console.log("  - req.auth.hospitalId:", req.auth.hospitalId);
    console.log("  - req.auth.hospitalId type:", typeof req.auth.hospitalId);
    console.log("  - req.user.hospital:", req.user.hospital);
    console.log("  - req.user.hospital type:", typeof req.user.hospital);
    console.log("  - String comparison - Request hospital:", String(request.scope.hospitalId));
    console.log("  - String comparison - User hospital:", String(req.user.hospital));
    console.log("  - Are they equal?", String(request.scope.hospitalId) === String(req.user.hospital));

    if (String(request.scope.hospitalId) !== String(req.user.hospital)) {
      return res.status(403).json({ message: "Cross-hospital access denied" });
    }

    // Fetch assets - Add detailed logging
    console.log("🔍 Asset Query Debug:");
    console.log("  - Request ID:", request._id);
    console.log("  - Asset IDs provided:", assetIds);
    console.log("  - Query conditions:");
    console.log("    _id: { $in: assetIds }");
    console.log("    'reservation.requestId':", request._id);
    console.log("    status: 'active'");
    console.log("    lifecycleStatus: 'active'");

    // First, let's check what the actual asset looks like without strict filtering
    const allProvidedAssets = await Asset.find({ _id: { $in: assetIds } });
    console.log("  - All provided assets (no filtering):");
    allProvidedAssets.forEach((asset, index) => {
      console.log(`    Asset ${index + 1}:`, {
        id: asset._id,
        name: asset.assetName,
        status: asset.status,
        lifecycleStatus: asset.lifecycleStatus,
        reservation: asset.reservation
      });
    });

    const assets = await Asset.find({
      _id: { $in: assetIds },
      "reservation.requestId": request._id,
      status: "active",
      lifecycleStatus: "active"
    });

    console.log("  - Assets found with strict criteria:", assets.length);
    console.log("  - Expected:", assetIds.length);
    console.log("  - Found assets details:");
    assets.forEach((asset, index) => {
      console.log(`    Asset ${index + 1}:`, {
        id: asset._id,
        name: asset.assetName,
        status: asset.status,
        lifecycleStatus: asset.lifecycleStatus,
        reservation: asset.reservation
      });
    });

    if (assets.length !== assetIds.length) {
      return res.status(409).json({ message: "Asset conflict detected" });
    }

    // Fulfill assets
    for (const asset of assets) {
      asset.currentDepartmentId = request.scope.departmentId;
      asset.utilizationStatus = "in_use";

      asset.reservation = {
        isReserved: false,
        requestId: null,
        reservedByDepartmentId: null,
        reservedAt: null
      };

      await asset.save();

      request.fulfillment.fulfilledAssets.push({
        assetId: asset._id,
        fromDepartmentId: asset.departmentId,
        fulfilledAt: new Date(),
        fulfilledBy: req.user._id
      });
    }

    request.fulfillment.fulfilledCount += assets.length;

    // AUTO COMPLETE if fully fulfilled
    const totalRequested = request.requestedAssets ? 
      request.requestedAssets.length : 
      request.fulfillment.requestedCount;
    
    if (request.fulfillment.fulfilledCount >= totalRequested) {
      // Mark current approval level as approved before changing status
      const currentLevel = request.currentLevel;
      if (currentLevel && currentLevel !== "completed") {
        request.approvalFlow[currentLevel] = {
          status: "approved",
          approvedBy: req.user._id,
          date: new Date(),
          remarks: "Assets fulfilled and transferred"
        };
      }
      
      request.finalStatus = "approved";
      request.currentLevel = "completed";
    }

    request.escalation.lastActionAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: "Assets fulfilled successfully",
      data: request
    });
  } catch (err) {
    console.error("fulfillAssetRequest error:", err);
    res.status(500).json({ message: "Failed to fulfill request" });
  }
};

export const getDepartmentAssets = async (req, res) => {
  try {
    const departmentId = req.user.department;
    const hospitalId = req.user.hospital;

    const assets = await Asset.find({
      currentDepartmentId: departmentId,
      hospitalId,
      lifecycleStatus: { $ne: "scrapped" }
    })
      .populate("reservation.requestId", "assetName priority finalStatus")
      .sort({ assetName: 1 });

    return res.status(200).json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (err) {
    console.error("getDepartmentAssets error:", err);
    res.status(500).json({ message: "Failed to fetch assets" });
  }
};

export const updateAssetUtilizationStatus = async (req, res) => {
  try {
    const { assetId } = req.params;
    const { utilizationStatus } = req.body;

    if (!["in_use", "not_in_use", "under_maintenance"].includes(utilizationStatus)) {
      return res.status(400).json({ message: "Invalid utilization status" });
    }

    const asset = await Asset.findOne({
      _id: assetId,
      currentDepartmentId: req.user.department,
      hospitalId: req.user.hospital
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    asset.utilizationStatus = utilizationStatus;
    await asset.save();

    res.status(200).json({
      success: true,
      message: "Asset status updated",
      asset
    });
  } catch (err) {
    console.error("updateAssetUtilizationStatus error:", err);
    res.status(500).json({ message: "Failed to update status" });
  }
};


