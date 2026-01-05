import express from "express";
import {
  getDashboardSummary,
  assetsByDepartment
} from "../Controllers/dashboardController.js";

const router = express.Router();

router.get("/summary", getDashboardSummary);
router.get("/assets-by-department", assetsByDepartment);

export default router;
