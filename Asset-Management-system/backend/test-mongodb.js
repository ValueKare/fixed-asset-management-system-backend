import mongoose from "mongoose";
import connectDB from "./Config/dbConfig.js";
import Hospital from "./models/Hospital.js";
import Department from "./models/Department.js";

async function testMongoDB() {
  try {
    await connectDB();
    console.log("MongoDB connected for testing");

    const hospitals = await Hospital.find().limit(5);
    console.log("Sample hospitals:", hospitals);

    const departments = await Department.find().limit(5);
    console.log("Sample departments:", departments);

    process.exit(0);
  } catch (error) {
    console.error("Error testing MongoDB:", error);
    process.exit(1);
  }
}

testMongoDB();
