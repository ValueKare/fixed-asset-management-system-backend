// backend/Controllers/requestController.js

import Request from "../Models/Request.js";
import logger from "../Utils/logger.js";
import mongoose from "mongoose";

/**
 * Approver levels in correct order.
 * Workflow:
 *  Level1 → Level2 → Level3 → HOD → Inventory → Purchase → Budget → CFO
 */
const APPROVAL_FLOW = [
  "level1",
  "level2",
  "level3",
  "hod",
  "inventory",
  "purchase",
  "budget",
  "cfo",
];

/**
 * Get next approval stage
 */
const getNextLevel = (currentLevel) => {
  const idx = APPROVAL_FLOW.indexOf(currentLevel);
  if (idx === -1 || idx === APPROVAL_FLOW.length - 1) {
    return "completed"; // CFO approved → DONE
  }
  return APPROVAL_FLOW[idx + 1];
};

/**
 * Create a new request (Employee or HOD)
 */
export const createRequest = async (req, res, next) => {
  try {
    const {
      assetCategory,
      assetName,
      quantity,
      department,
      priority,
      justification,
      estimatedCost,
      meta,
    } = req.body;

    if (!assetCategory || !assetName || !quantity || !department || !justification) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newRequest = await Request.create({
      requestedBy: new mongoose.Types.ObjectId(), // Generate valid ObjectId for testing
      requestType: "procurement", // Required field
      assetCategory,
      assetName,
      quantity,
      department,
      priority: priority || "medium",
      justification,
      estimatedCost: estimatedCost || 0,
      meta: meta || {},
      currentLevel: "level1",
      finalStatus: "pending",
    });
    logger.info(
  `REQUEST_CREATED | requestId=${newRequest._id} | asset=${assetName} | qty=${quantity} | dept=${department} | by=temp_user`
);


    res.status(201).json({
      message: "Request created successfully",
      request: newRequest,
    });
  } catch (err) {
    next(err);
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
export const getRequestById = async (req, res, next) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate("requestedBy", "name email role")
      .populate("approvalFlow.level1.approvedBy", "name email role")
      .populate("approvalFlow.level2.approvedBy", "name email role")
      .populate("approvalFlow.level3.approvedBy", "name email role")
      .populate("approvalFlow.hod.approvedBy", "name email role")
      .populate("approvalFlow.inventory.approvedBy", "name email role")
      .populate("approvalFlow.purchase.approvedBy", "name email role")
      .populate("approvalFlow.budget.approvedBy", "name email role")
      .populate("approvalFlow.cfo.approvedBy", "name email role");

    if (!request) return res.status(404).json({ message: "Request not found" });

    res.status(200).json(request);
  } catch (err) {
    next(err);
  }
};

/**
 * Get pending requests for logged-in approver
 */
export const getPendingForMe = async (req, res, next) => {
  try {
    const role = req.user.role;

    if (!APPROVAL_FLOW.includes(role)) {
      return res.status(403).json({ message: "Not part of approval workflow" });
    }

    const pending = await Request.find({
      currentLevel: role,
      finalStatus: "pending",
    })
      .sort({ createdAt: 1 })
      .populate("requestedBy", "name email role");

    res.status(200).json(pending);
  } catch (err) {
    next(err);
  }
};

/**
 * Approve Request (Level1 → Level2 → ... → CFO)
 */
export const approveRequest = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) return res.status(404).json({ message: "Request not found" });

    const currentRole = req.user.role;
if (request.currentLevel !== currentRole) {
  logger.warn(
    `UNAUTHORIZED_APPROVAL | requestId=${request._id} | attemptedBy=${req.user.id} | role=${currentRole} | expected=${request.currentLevel}`
  );

  return res.status(403).json({
    message: `You cannot approve at this stage. Current stage: ${request.currentLevel}`,
  });
}

    // Mark this stage as approved
    request.approvalFlow[currentRole] = {
      status: "approved",
      approvedBy: req.user.id,
      date: new Date(),
      remarks: remarks || "",
    };

    const nextLevel = getNextLevel(currentRole);
    request.currentLevel = nextLevel;

    // If CFO → Final approval
    if (nextLevel === "completed") {
      request.finalStatus = "approved";
    }

    await request.save();

    res.status(200).json({
      message: "Request approved",
      request,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Reject Request (any approver)
 */
export const rejectRequest = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const request = await Request.findById(req.params.id);

    if (!request) return res.status(404).json({ message: "Request not found" });

    const currentRole = req.user.role;

   if (request.currentLevel !== currentRole) {
  logger.warn(
    `UNAUTHORIZED_REJECT | requestId=${request._id} | attemptedBy=${req.user.id} | role=${currentRole} | expected=${request.currentLevel}`
  );

  return res.status(403).json({
    message: `You cannot reject at this stage. Current stage: ${request.currentLevel}`,
  });
}
    request.approvalFlow[currentRole] = {
      status: "rejected",
      approvedBy: req.user.id,
      date: new Date(),
      remarks: remarks || "",
    };

    request.finalStatus = "rejected";
    request.currentLevel = "rejected";

    await request.save();

    logger.info(
  `REQUEST_REJECTED | requestId=${request._id} | level=${currentRole} | by=${req.user.id} | remarks=${remarks || "NA"}`
);


    res.status(200).json({
      message: "Request rejected",
      request,
    });
  } catch (err) {
    next(err);
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

