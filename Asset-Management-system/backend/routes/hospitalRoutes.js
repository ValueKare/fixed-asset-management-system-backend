import express from "express";
import { createHospital, getHospitals } from "../Controllers/hospitalController.js";
import { protect } from "../Middlewares/authMiddleware.js";
import { authorizeRoles } from "../Middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("superadmin"), createHospital);
router.get("/", protect, authorizeRoles("superadmin", "auditmanager"), getHospitals);

export default router;


