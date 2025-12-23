import {model,Schema,mongoose} from "mongoose";

const assignedAssetSchema=new mongoose.Schema({
    assetId:{type:Schema.Types.ObjectId},
    employeeId:{type:Schema.Types.ObjectId},
    assignedAt:{type:Date,default:Date.now()},
    returnedAt:{type:Date,default:null},
    returnedCondition:{type:String,default:null},
    note:{type:String,default:null}
},{timestamps:true})

const AssignedAssets=model("AssignedAssets",assignedAssetSchema)

export default AssignedAssets
