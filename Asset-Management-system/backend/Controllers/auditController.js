// backend/controllers/auditController.js

import Audit from "../Models/Audit.js";
import AuditAsset from "../Models/AuditAsset.js";
import Asset from "../Models/Asset.js";
import Hospital from "../Models/Hospital.js";
import {
  logAuditStarted,
  logAuditAssetVerified
} from "../utils/auditLogger.js";

/* ======================================================
   1️⃣ INITIATE AUDIT
   Creates audit master & assigns assets
====================================================== */

export const initiateAudit = async (req, res) => {
  try {
    const {
      auditCode,
      hospitalId,
      auditType,
      periodFrom,
      periodTo,
      assignedAuditors
    } = req.body;

    if (!auditCode || !hospitalId || !auditType) {
      return res.status(400).json({
        message: "auditCode, hospitalId, auditType are required"
      });
    }

    // Find hospital by hospitalId string to get its ObjectId
    const hospital = await Hospital.findOne({ hospitalId });
    if (!hospital) {
      return res.status(404).json({
        message: "Hospital not found with given hospitalId"
      });
    }

    // Create Audit (Master)
    const audit = await Audit.create({
      auditCode,
      hospitalId: hospital._id, // Use ObjectId instead of string
      organizationId: req.user.organizationId,
      auditType,
      periodFrom,
      periodTo,
      initiatedBy: req.user._id,
      assignedAuditors,
      status: "in_progress",
      startedAt: new Date()
    });

    // Fetch all assets for this hospital
    const assets = await Asset.find({ hospitalId: hospital._id });

    // Create audit-asset records
    const auditAssets = assets.map(asset => ({
      auditId: audit._id,
      assetKey: asset.assetKey,
      hospitalId: hospital._id, // Use ObjectId instead of string
      systemStatus: asset.status,
      physicalStatus: "found" // default, will be updated by auditor
    }));

    await AuditAsset.insertMany(auditAssets);

    // Audit Log
    await logAuditStarted(req, audit);

    return res.status(201).json({
      message: "Audit initiated successfully",
      auditId: audit._id,
      totalAssets: auditAssets.length
    });

  } catch (err) {
    console.error("❌ initiateAudit failed:", err);
    return res.status(500).json({
      message: "Failed to initiate audit",
      error: err.message
    });
  }
};

/* ======================================================
   2️⃣ VERIFY ASSET DURING AUDIT
====================================================== */

export const verifyAuditAsset = async (req, res) => {
  try {
    const { auditId, assetKey } = req.params;
    const { physicalStatus, auditorRemark, locationMatched = true } = req.body;

    if (!physicalStatus) {
      return res.status(400).json({
        message: "physicalStatus is required"
      });
    }

    const auditAsset = await AuditAsset.findOne({
      auditId,
      assetKey
    });

    if (!auditAsset) {
      return res.status(404).json({
        message: "Audit asset not found"
      });
    }

    const discrepancy =
      physicalStatus !== "found" || locationMatched === false;

    auditAsset.physicalStatus = physicalStatus;
    auditAsset.locationMatched = locationMatched;
    auditAsset.discrepancy = discrepancy;
    auditAsset.auditorRemark = auditorRemark;
    auditAsset.verifiedBy = req.user._id;
    auditAsset.verifiedAt = new Date();

    await auditAsset.save();

    // Audit Log
    await logAuditAssetVerified({
      auditorId: req.user._id,
      hospitalId: auditAsset.hospitalId,
      auditAsset,
      assetKey,
      physicalStatus,
      remark: auditorRemark
    });

    return res.json({
      message: "Asset verified successfully",
      discrepancy
    });

  } catch (err) {
    console.error("❌ verifyAuditAsset failed:", err);
    return res.status(500).json({
      message: "Failed to verify asset",
      error: err.message
    });
  }
};

/* ======================================================
   3️⃣ SUBMIT AUDIT
====================================================== */

export const submitAudit = async (req, res) => {
  try {
    const { auditId } = req.params;

    const audit = await Audit.findById(auditId);
    if (!audit) {
      return res.status(404).json({ message: "Audit not found" });
    }

    audit.status = "submitted";
    audit.submittedAt = new Date();
    await audit.save();

    return res.json({
      message: "Audit submitted successfully"
    });

  } catch (err) {
    console.error("❌ submitAudit failed:", err);
    return res.status(500).json({
      message: "Failed to submit audit",
      error: err.message
    });
  }
};

/* ======================================================
   4️⃣ CLOSE AUDIT
====================================================== */

export const closeAudit = async (req, res) => {
  try {
    const { auditId } = req.params;

    const audit = await Audit.findById(auditId);
    if (!audit) {
      return res.status(404).json({ message: "Audit not found" });
    }

    audit.status = "closed";
    audit.closedAt = new Date();
    await audit.save();

    return res.json({
      message: "Audit closed successfully"
    });

  } catch (err) {
    console.error("❌ closeAudit failed:", err);
    return res.status(500).json({
      message: "Failed to close audit",
      error: err.message
    });
  }
};

/* ======================================================
   6️⃣ GET AUDIT ASSETS FOR VERIFICATION
====================================================== */

export const getAuditAssets = async (req, res) => {
  try {
    const { auditId } = req.params;
    const { page = 1, limit = 20, status, search, departmentId } = req.query;

    // Build filter
    const filter = { auditId };
    if (status && status !== 'all') {
      filter.physicalStatus = status;
    }
    if (search) {
      filter.assetKey = { $regex: search, $options: 'i' };
    }

    // Get audit assets with pagination
    const skip = (page - 1) * limit;
    const auditAssets = await AuditAsset.find(filter)
      .populate('auditId', 'auditCode auditType status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get complete asset details for each audit asset
    const assetKeys = auditAssets.map(aa => aa.assetKey);
    const assets = await Asset.find({ assetKey: { $in: assetKeys } })
      .populate('departmentId', 'name')
      .populate('hospitalId', 'name')
      .populate('buildingId', 'name buildingCode address')
      .populate('floorId', 'name floorNumber')
      .populate('currentDepartmentId', 'name');

    // Combine audit asset data with complete asset details
    const auditAssetsWithDetails = auditAssets.map(auditAsset => {
      const assetDetails = assets.find(asset => asset.assetKey === auditAsset.assetKey);
      return {
        ...auditAsset.toObject(),
        assetDetails: assetDetails || null
      };
    });

    // Department-wise segregation
    const assetsByDepartment = {};
    const departmentStats = {};
    let totalAssets = 0;
    let verifiedAssets = 0;
    let discrepancyAssets = 0;

    auditAssetsWithDetails.forEach(auditAsset => {
      const deptId = auditAsset.assetDetails?.departmentId?._id || 'unassigned';
      const deptName = auditAsset.assetDetails?.departmentId?.name || 'Unassigned';
      
      // Initialize department if not exists
      if (!assetsByDepartment[deptId]) {
        assetsByDepartment[deptId] = {
          departmentId: deptId,
          departmentName: deptName,
          assets: [],
          stats: {
            total: 0,
            verified: 0,
            discrepancies: 0,
            pending: 0
          }
        };
      }

      // Add asset to department
      assetsByDepartment[deptId].assets.push(auditAsset);
      
      // Update department stats
      assetsByDepartment[deptId].stats.total++;
      totalAssets++;
      
      if (auditAsset.verifiedAt) {
        assetsByDepartment[deptId].stats.verified++;
        verifiedAssets++;
      } else {
        assetsByDepartment[deptId].stats.pending++;
      }
      
      if (auditAsset.discrepancy) {
        assetsByDepartment[deptId].stats.discrepancies++;
        discrepancyAssets++;
      }
    });

    // Convert to array and sort by department name
    const departmentsArray = Object.values(assetsByDepartment).sort((a, b) => 
      a.departmentName.localeCompare(b.departmentName)
    );

    // Get total count for pagination
    const totalCount = await AuditAsset.countDocuments(filter);

    // Get available departments for filtering
    const assetsWithDepartments = await Asset.find({ 
      assetKey: { $in: assetKeys },
      departmentId: { $exists: true, $ne: null }
    }).populate('departmentId', 'name').select('departmentId');
    
    // Extract unique departments
    const allDepartments = [];
    const seenDeptIds = new Set();
    
    assetsWithDepartments.forEach(asset => {
      if (asset.departmentId && !seenDeptIds.has(asset.departmentId._id.toString())) {
        seenDeptIds.add(asset.departmentId._id.toString());
        allDepartments.push(asset.departmentId);
      }
    });

    return res.json({
      auditAssets: auditAssetsWithDetails,
      assetsByDepartment: departmentsArray,
      departmentStats: departmentsArray.reduce((acc, dept) => {
        acc[dept.departmentId] = dept.stats;
        return acc;
      }, {}),
      overallStats: {
        totalAssets,
        verifiedAssets,
        discrepancyAssets,
        pendingAssets: totalAssets - verifiedAssets,
        verificationRate: totalAssets > 0 ? ((verifiedAssets / totalAssets) * 100).toFixed(2) : 0
      },
      availableDepartments: allDepartments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      }
    });

  } catch (err) {
    console.error("❌ getAuditAssets failed:", err);
    return res.status(500).json({
      message: "Failed to fetch audit assets",
      error: err.message
    });
  }
};

/* ======================================================
   7️⃣ GET SINGLE AUDIT ASSET FOR VERIFICATION
====================================================== */

export const getAuditAssetForVerification = async (req, res) => {
  try {
    const { auditId, assetKey } = req.params;

    // Get audit asset
    const auditAsset = await AuditAsset.findOne({ auditId, assetKey })
      .populate('auditId', 'auditCode auditType status');

    if (!auditAsset) {
      return res.status(404).json({
        message: "Audit asset not found"
      });
    }

    // Get complete asset details
    const asset = await Asset.findOne({ assetKey })
      .populate('departmentId', 'name')
      .populate('hospitalId', 'name')
      .populate('buildingId', 'name buildingCode address')
      .populate('floorId', 'name floorNumber')
      .populate('currentDepartmentId', 'name');

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found"
      });
    }

    // Get verification history if any
    const verificationHistory = await AuditAsset.find({
      assetKey,
      'verifiedAt': { $exists: true }
    })
    .populate('verifiedBy', 'name email')
    .populate('auditId', 'auditCode auditType')
    .sort({ verifiedAt: -1 })
    .limit(5);

    return res.json({
      auditAsset: auditAsset,
      asset: asset,
      verificationHistory: verificationHistory,
      verificationStatus: {
        physicalStatus: auditAsset.physicalStatus,
        locationMatched: auditAsset.locationMatched,
        discrepancy: auditAsset.discrepancy,
        auditorRemark: auditAsset.auditorRemark,
        verifiedAt: auditAsset.verifiedAt,
        verifiedBy: auditAsset.verifiedBy
      }
    });

  } catch (err) {
    console.error("❌ getAuditAssetForVerification failed:", err);
    return res.status(500).json({
      message: "Failed to fetch audit asset for verification",
      error: err.message
    });
  }
};

/* ======================================================
   9️⃣ GET ALL AUDITS
====================================================== */

export const getAllAudits = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      auditType, 
      hospitalId,
      search 
    } = req.query;

    // Build filter
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (auditType && auditType !== 'all') {
      filter.auditType = auditType;
    }
    if (hospitalId) {
      filter.hospitalId = hospitalId;
    }
    if (search) {
      filter.$or = [
        { auditCode: { $regex: search, $options: 'i' } },
        { auditType: { $regex: search, $options: 'i' } }
      ];
    }

    // Add organization filter if user is not superadmin
    if (req.user.role !== 'superadmin') {
      filter.organizationId = req.user.organizationId;
    }

    // Get audits with pagination
    const skip = (page - 1) * limit;
    const audits = await Audit.find(filter)
      .populate('hospitalId', 'name hospitalId')
      .populate('initiatedBy', 'name email')
      .populate('assignedAuditors', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get audit statistics for each audit
    const auditIds = audits.map(audit => audit._id);
    const auditStats = await AuditAsset.aggregate([
      { $match: { auditId: { $in: auditIds } } },
      {
        $group: {
          _id: '$auditId',
          totalAssets: { $sum: 1 },
          verifiedAssets: {
            $sum: { $cond: [{ $ne: ['$verifiedAt', null] }, 1, 0] }
          },
          discrepancyAssets: {
            $sum: { $cond: ['$discrepancy', 1, 0] }
          }
        }
      }
    ]);

    // Combine audits with their statistics
    const auditsWithStats = audits.map(audit => {
      const stats = auditStats.find(stat => stat._id.toString() === audit._id.toString());
      return {
        ...audit.toObject(),
        stats: stats || {
          totalAssets: 0,
          verifiedAssets: 0,
          discrepancyAssets: 0,
          verificationRate: 0
        }
      };
    });

    // Calculate verification rate
    auditsWithStats.forEach(audit => {
      const { totalAssets, verifiedAssets } = audit.stats;
      audit.stats.verificationRate = totalAssets > 0 
        ? ((verifiedAssets / totalAssets) * 100).toFixed(2) 
        : 0;
    });

    // Get total count for pagination
    const totalCount = await Audit.countDocuments(filter);

    return res.json({
      audits: auditsWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit: parseInt(limit)
      },
      filters: {
        status,
        auditType,
        hospitalId,
        search
      }
    });

  } catch (err) {
    console.error("❌ getAllAudits failed:", err);
    return res.status(500).json({
      message: "Failed to fetch audits",
      error: err.message
    });
  }
};

/* ======================================================
   10️⃣ GET AUDIT SUMMARY
====================================================== */

export const getAuditSummary = async (req, res) => {
  try {
    const { auditId } = req.params;

    const summary = await AuditAsset.aggregate([
      { $match: { auditId: new AuditAsset().auditId?.constructor(auditId) } },
      {
        $group: {
          _id: "$physicalStatus",
          count: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      auditId,
      summary
    });

  } catch (err) {
    console.error("❌ getAuditSummary failed:", err);
    return res.status(500).json({
      message: "Failed to fetch audit summary",
      error: err.message
    });
  }
};
