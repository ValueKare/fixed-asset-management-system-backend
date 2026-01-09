/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     summary: Get all organizations
 *     tags: [Organizations]
 *     responses:
 *       200:
 *         description: List of organizations
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 organizations: [{ id: "HOSP-2024-001", name: "ValueKare Medical Center", ... }]
 *   post:
 *     summary: Create a new organization
 *     tags: [Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               address: { type: string }
 *               meta: { type: object }
 *     responses:
 *       201:
 *         description: Organization created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: "HOSP-2024-001" }
 *               message: Organization created
 * /api/v1/organizations/{orgId}:
 *   put:
 *     summary: Update an organization
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               meta: { type: object }
 *     responses:
 *       200:
 *         description: Organization updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: "HOSP-2024-001" }
 *               message: Organization updated
 * /api/v1/organizations/{orgId}/buildings:
 *   get:
 *     summary: Get all buildings for an organization
 *     tags: [Buildings]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of buildings
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 buildings: [{ id: "bldg_01", name: "Main Building", ... }]
 *   post:
 *     summary: Create a building for an organization
 *     tags: [Buildings]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: Building created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: "bldg_01" }
 *               message: Building created
 * /api/v1/buildings/{buildingId}:
 *   put:
 *     summary: Update a building
 *     tags: [Buildings]
 *     parameters:
 *       - in: path
 *         name: buildingId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               address: { type: string }
 *     responses:
 *       200:
 *         description: Building updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: "bldg_01" }
 *               message: Building updated
 * /api/v1/buildings/{buildingId}/floors:
 *   get:
 *     summary: Get all floors for a building
 *     tags: [Floors]
 *     parameters:
 *       - in: path
 *         name: buildingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of floors
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 floors: [{ id: "floor_01", name: "Ground Floor", ... }]
 *   post:
 *     summary: Create a floor for a building
 *     tags: [Floors]
 *     parameters:
 *       - in: path
 *         name: buildingId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               level: { type: number }
 *     responses:
 *       201:
 *         description: Floor created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: "floor_01" }
 *               message: Floor created
 * /api/v1/floors/{floorId}:
 *   put:
 *     summary: Update a floor
 *     tags: [Floors]
 *     parameters:
 *       - in: path
 *         name: floorId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               level: { type: number }
 *     responses:
 *       200:
 *         description: Floor updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: "floor_01" }
 *               message: Floor updated
 * /api/v1/organizations/{orgId}/departments:
 *   get:
 *     summary: Get all departments for an organization
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of departments
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 departments: [{ id: "dept_icu", name: "ICU", ... }]
 *   post:
 *     summary: Create a department for an organization
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *     responses:
 *       201:
 *         description: Department created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: "dept_icu" }
 *               message: Department created
 * /api/v1/departments/{departmentId}:
 *   put:
 *     summary: Update a department
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Department updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: "dept_icu" }
 *               message: Department updated
 * /api/v1/organizations/{orgId}/cost-centers:
 *   get:
 *     summary: Get all cost centers for an organization
 *     tags: [CostCenters]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of cost centers
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 costCenters: [{ id: "cc_001", code: "CC-ICU-001", ... }]
 *   post:
 *     summary: Create a cost center for an organization
 *     tags: [CostCenters]
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Cost center created
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: "cc_001" }
 *               message: Cost center created
 * /api/v1/cost-centers/{costCenterId}:
 *   put:
 *     summary: Update a cost center
 *     tags: [CostCenters]
 *     parameters:
 *       - in: path
 *         name: costCenterId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Cost center updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: { id: "cc_001" }
 *               message: Cost center updated
 */
// backend/routes/entityRouter.js
import express from "express";
import mongoose from "mongoose";
import {
  createEntity,
  getAllEntities,
  getEntityById,
  updateEntity,
  deleteEntity,
} from "../Controllers/entityController.js";
import { authMiddleware, protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";
import requirePermission from "../Middlewares/PermissionMiddleware.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Entity
 *   description: Master data for hospital entities (hospitals/locations)
 */

/**
 * @swagger
 * /api/entity:
 *   post:
 *     summary: Create a new Entity (hospital / center)
 *     tags: [Entity]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entity created
 */
router.post("/",authMiddleware,
  requirePermission("user", "create"), createEntity);

/**
 * @swagger
 * /api/entity:
 *   get:
 *     summary: Get all entities
 *     tags: [Entity]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: string
 *         description: Filter by active status (true/false)
 *     responses:
 *       200:
 *         description: List of entities
 */
router.get("/api/entity", getAllEntities);

/**
 * @swagger
 * /api/entity/{id}:
 *   get:
 *     summary: Get entity by id
 *     tags: [Entity]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Single entity
 */
router.get("/:id", getEntityById);

/**
 * @swagger
 * /api/entity/{id}:
 *   put:
 *     summary: Update an entity
 *     tags: [Entity]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated entity
 */
router.put("/:id", updateEntity);

/**
 * @swagger
 * /api/entity/{id}:
 *   delete:
 *     summary: Deactivate (soft delete) an entity
 *     tags: [Entity]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Entity deactivated
 */
router.delete("/:id", deleteEntity);

// --- ORGANIZATION (ENTITY) ---
router.get("/api/v1/organizations", async (req, res) => {
  const Entity = (await import("../Models/Entity.js")).default;
  const orgs = await Entity.find();
  res.json({ success: true, data: { organizations: orgs.map(o => ({
    id: o.code,
    name: o.name,
    type: "Hospital",
    address: o.address,
    contactPerson: o.meta?.contactPerson,
    email: o.meta?.email,
    phone: o.meta?.phone,
    totalBuildings: o.meta?.totalBuildings,
    totalAssets: o.meta?.totalAssets,
    status: o.isActive ? "Active" : "Inactive",
    createdAt: o.createdAt
  })) } });
});

router.post("/api/v1/organizations", async (req, res) => {
  const Entity = (await import("../Models/Entity.js")).default;
  const org = await Entity.create(req.body);
  res.status(201).json({ success: true, data: { id: org.code }, message: "Organization created" });
});

router.put("/api/v1/organizations/:orgId", async (req, res) => {
  const Entity = (await import("../Models/Entity.js")).default;
  const org = await Entity.findOneAndUpdate({ code: req.params.orgId }, req.body, { new: true });
  if (!org) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data: { id: org.code }, message: "Organization updated" });
});

// --- BUILDING ---
router.get("/api/v1/organizations/:orgId/buildings", async (req, res) => {
  const Building = (await import("../Models/Building.js")).default;
  const buildings = await Building.find({ organizationId: req.params.orgId });
  res.json({ success: true, data: { buildings } });
});

router.post("/api/v1/organizations/:orgId/buildings", async (req, res) => {
  const Building = (await import("../Models/Building.js")).default;
  const buildingId = req.body.id || `BLD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const building = await Building.create({ 
    ...req.body, 
    id: buildingId,
    organizationId: req.params.orgId 
  });
  res.status(201).json({ success: true, data: { id: building.id }, message: "Building created" });
});

router.put("/api/v1/buildings/:buildingId", async (req, res) => {
  const Building = (await import("../Models/Building.js")).default;
  const building = await Building.findOneAndUpdate({ id: req.params.buildingId }, req.body, { new: true });
  if (!building) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data: { id: building.id }, message: "Building updated" });
});

// --- FLOOR ---
router.get("/api/v1/buildings/:buildingId/floors", async (req, res) => {
  const Floor = (await import("../Models/Floor.js")).default;
  const floors = await Floor.find({ buildingId: req.params.buildingId });
  res.json({ success: true, data: { floors } });
});

router.post("/api/v1/buildings/:buildingId/floors", async (req, res) => {
  const Floor = (await import("../Models/Floor.js")).default;
  const floor = await Floor.create({ ...req.body, buildingId: req.params.buildingId });
  res.status(201).json({ success: true, data: { id: floor.id }, message: "Floor created" });
});

router.put("/api/v1/floors/:floorId", async (req, res) => {
  const Floor = (await import("../Models/Floor.js")).default;
  const floor = await Floor.findOneAndUpdate({ id: req.params.floorId }, req.body, { new: true });
  if (!floor) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data: { id: floor.id }, message: "Floor updated" });
});

// --- DEPARTMENT ---
router.get("/api/v1/organizations/:orgId/departments", async (req, res) => {
  try {
    const Department = (await import("../Models/Department.js")).default;
    const Entity = (await import("../Models/Entity.js")).default;
    
    const { orgId } = req.params;
    
    // Check if orgId is a valid ObjectId or a string code
    let organizationId;
    if (mongoose.Types.ObjectId.isValid(orgId)) {
      organizationId = orgId;
    } else {
      // Find entity by code and get its ObjectId
      const entity = await Entity.findOne({ code: orgId });
      if (!entity) {
        return res.status(404).json({ 
          success: false, 
          message: "Organization not found" 
        });
      }
      organizationId = entity._id;
    }
    
    const departments = await Department.find({ organizationId });
    res.json({ success: true, data: { departments } });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch departments", 
      error: error.message 
    });
  }
});

router.get("/api/v1/hospitals/:hospitalId/departments", async (req, res) => {
  const Department = (await import("../Models/Department.js")).default;
  const departments = await Department.find({ hospitalId: req.params.hospitalId });
  res.json({ success: true, data: { departments } });
});

router.post("/api/v1/organizations/:orgId/departments", async (req, res) => {
  const Department = (await import("../Models/Department.js")).default;
  const department = await Department.create({ ...req.body, organizationId: req.params.orgId });
  res.status(201).json({ success: true, data: { id: department.id }, message: "Department created" });
});

router.put("/api/v1/departments/:departmentId", async (req, res) => {
  const Department = (await import("../Models/Department.js")).default;
  const department = await Department.findOneAndUpdate({ id: req.params.departmentId }, req.body, { new: true });
  if (!department) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data: { id: department.id }, message: "Department updated" });
});

// --- COST CENTER ---
router.get("/api/v1/organizations/:orgId/cost-centers", async (req, res) => {
  const CostCenter = (await import("../Models/CostCenter.js")).default;
  const costCenters = await CostCenter.find({ organizationId: req.params.orgId });
  res.json({ success: true, data: { costCenters } });
});

router.post("/api/v1/organizations/:orgId/cost-centers", async (req, res) => {
  const CostCenter = (await import("../Models/CostCenter.js")).default;
  const costCenter = await CostCenter.create({ ...req.body, organizationId: req.params.orgId });
  res.status(201).json({ success: true, data: { id: costCenter.id }, message: "Cost center created" });
});

router.put("/api/v1/cost-centers/:costCenterId", async (req, res) => {
  const CostCenter = (await import("../Models/CostCenter.js")).default;
  const costCenter = await CostCenter.findOneAndUpdate({ id: req.params.costCenterId }, req.body, { new: true });
  if (!costCenter) return res.status(404).json({ success: false, message: "Not found" });
  res.json({ success: true, data: { id: costCenter.id }, message: "Cost center updated" });
});

export default router;
