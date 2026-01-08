import mongoose from "mongoose";
import Department from "./Models/Department.js";

async function findDepartment() {
  try {
    const departments = await Department.find({}, { name: 1 });
    console.log("All departments:", departments.map(d => d.name));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Connect to MongoDB first
mongoose.connect("mongodb://localhost:27017/your-database-name")
  .then(() => {
    console.log("Connected to MongoDB");
    findDepartment();
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
