import mongoose from "mongoose";
import { config } from "dotenv";
config();

const mongoURL = process.env.MONGO_URI || "mongodb+srv://as7488896_db_user:eRJPjZWD4HzTVVKh@cluster0.4cphubk.mongodb.net/?appName=Cluster0";

async function connectDB() {
  try {
    await mongoose.connect(mongoURL, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log("MongoDB Atlas connected successfully");
  } catch (error) {
    console.log("Database connection error:", error.message);
  }
}

export default connectDB;










