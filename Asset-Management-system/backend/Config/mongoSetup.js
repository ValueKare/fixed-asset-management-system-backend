// Initialize MongoDB collections
import mongoose from "mongoose";

// Import all models to ensure they're registered
import Admin from "../Models/Admin.js";
import Asset from "../Models/Asset.js";
import AssignedAssets from "../Models/AssignedAssets.js";
import Audit from "../Models/Audit.js";
import AuditAsset from "../Models/AuditAsset.js";
import Auditlog from "../Models/Auditlog.js";
import Building from "../Models/Building.js";
import CostCenter from "../Models/CostCenter.js";
import Department from "../Models/Department.js";
import Employee from "../Models/Employee.js";
import Entity from "../Models/Entity.js";
import Floor from "../Models/Floor.js";
import Hospital from "../Models/Hospital.js";
import LoginActivity from "../Models/LoginActivity.js";
import MaintenanceLog from "../Models/MaintenanceLog.js";
import Notification from "../Models/Notification.js";
import Request from "../Models/Request.js";
import Role from "../Models/Role.js";
import ScrapRequest from "../Models/ScrapRequest.js";
import User from "../Models/User.js";
import assetUtilizationLogSchema from "../Models/assetUtilizationLogSchema.js";
// Note: Counter model is already imported in hospitalController.js, so we don't import it here
import maintenanceContractSchema from "../Models/maintenanceContractSchema.js";

export async function initMongoCollections() {
  try {
    console.log("🔍 Initializing MongoDB collections...");
    
    // Get all model names
    const modelNames = mongoose.modelNames();
    console.log(`📋 Found ${modelNames.length} registered models:`, modelNames);
    
    // Create collections by inserting and deleting a dummy document for each model
    for (const modelName of modelNames) {
      try {
        const Model = mongoose.model(modelName);
        
        // Check if collection already exists
        const collections = await mongoose.connection.db.listCollections({ name: modelName.toLowerCase() + 's' }).toArray();
        
        if (collections.length === 0) {
          // Create a dummy document and immediately delete it to create the collection
          const dummyDoc = new Model();
          await dummyDoc.save();
          await Model.deleteOne({ _id: dummyDoc._id });
          console.log(`✅ Created collection: ${modelName.toLowerCase()}s`);
        } else {
          console.log(`ℹ️  Collection already exists: ${modelName.toLowerCase()}s`);
        }
      } catch (error) {
        console.log(`⚠️  Could not create collection for ${modelName}:`, error.message);
      }
    }
    
    console.log("🎉 MongoDB collections initialization completed");
  } catch (error) {
    console.error("❌ Failed to initialize MongoDB collections:", error);
  }
}
