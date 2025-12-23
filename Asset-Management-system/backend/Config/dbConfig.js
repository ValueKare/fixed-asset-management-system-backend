import mongoose from "mongoose";
import {config} from "dotenv"
config()

const mongoURL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hospitalAssetDB"
async function connectDB(){
    try{
          await mongoose.connect(mongoURL)
          console.log("db connected")
    }
    catch(error){
        console.log(error.message)
    }
}
export default connectDB;










