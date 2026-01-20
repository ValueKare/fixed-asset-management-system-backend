import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createServer } from "http";
import socketManager from "./Utils/socketManager.js";
          
// app.js or server.js
import ScrapRoutes from "./routes/ScrapRoutes.js";

import connectDB from "./Config/dbConfig.js";
import { pool } from "./Config/mysql.js";
import { initMongoCollections } from "./Config/mongoSetup.js";




// Routers
import csvRouter from "./routes/nbcUpload.js";
import hospitalUpload from "./routes/hospitalUpload.js";

import adminRouter from "./routes/adminRouter.js";
import assetSqlRouter from "./routes/assetSqlRouter.js";
import employeeRouter from "./routes/employeeRouter.js";
import authRouter from "./routes/authRouter.js";
import requestRouter from "./routes/requestRouter.js";
import reportRouter from "./routes/reportRouter.js";
import uploadRouter from "./routes/uploadRouter.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import barcodeRouter from "./routes/barcodeRouter.js";
import entityRouter from "./routes/entityRouter.js";
import userRouter from "./routes/userRouter.js"
import roleRouter from "./routes/roleRouter.js"
import dashboardRoutes from "./routes/dashboardRoutes.js";
import auditRoutes from "./routes/auditRoutes.js"


// Middleware
import errorHandler from "./Middlewares/errorHandler.js";

// Swagger
import { swaggerUi, swaggerSpec } from "./Config/swagger.js";
// import express from "express";
import initMySQLSchema from "./Config/mysqlSetup.js";





const app = express();
const server = createServer(app);
const port = process.env.SERVER_PORT || process.env.PORT || 5001;

// ---------------- Middleware ----------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static("uploads"));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000","http://localhost:3001"],
    credentials: true,
  })
);

app.use(morgan("dev"));

// ---------------- Routes ----------------
app.get("/", (req, res) => {
  res.send({ message: "Server is working" });
});

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Upload routes
app.use("/api/upload/nbc", csvRouter);        // nbc_assets
app.use(userRouter);
app.use("/api/upload/hospital", hospitalUpload);   // hospital_assets
app.use("/api/upload", uploadRouter); 
// Other APIs
app.use("/api/barcode", barcodeRouter);
app.use("/api/entity", entityRouter);
app.use("/api/roles", roleRouter);

app.use("/api/admin", adminRouter);
app.use("/api/sql/assets", assetSqlRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/auth", authRouter);
app.use("/api/requests", requestRouter);
app.use("/api/reports", reportRouter);
app.use("/api/hospital", hospitalRoutes);
app.use("/api/scrap", ScrapRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit", auditRoutes);

// Error handler
app.use(errorHandler);
(async () => {
  try {
    console.log("Database initializing");
    await initMySQLSchema();
    console.log("✅ Database schema initialized");
  } catch (err) {
    console.error("❌ Schema initialization failed", err);
  }
})();
dotenv.config();
// DB connections
connectDB();
initMongoCollections();

// Initialize Socket.IO
socketManager.initialize(server);

// Server
server.listen(port, "0.0.0.0",() => {
  console.log(`Server running on port ${port}`);
});


