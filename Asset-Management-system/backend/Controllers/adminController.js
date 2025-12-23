 import Asset from "../Models/Asset.js"
import AssignedAssets from "../Models/AssignedAssets.js"
import Employee from "../Models/Employee.js"

export const getAllAssets = async (req, res) => {
  try {
    const assignedAssets = await Asset.find({ 
      status: "assigned"  // Directly query assets where status='assigned'
    })// Only return needed fields

    res.status(200).json({
      success: true,
      data: assignedAssets
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned assets"
    });
  }
};


 export const assignedAsset=async(req,res,next)=>{
    try{
    // console.log(req.body)
        let {assetTag,empId,assignedAt}=req.body
        let isAssetAvailable=await Asset.findOne({assetTag})
        if(isAssetAvailable?.status=="available"){
            let isEmployee=await Employee.findOne({empId})
            if(isEmployee){
              //store the assetId and employeeid and the assignedAt
              const assignAssetDetails=new AssignedAssets({assetId:isAssetAvailable._id,employeeId:isEmployee._id,assignedAt})
              await assignAssetDetails.save()
             //modify the status of asset 
             isAssetAvailable.status="assigned"
             await isAssetAvailable.save()

              res.status(200).send({message:"Asset assigned succesfully"})
            }
            else{
                throw new Error("Invalid Employee Id")
            }
        }
        else{
            throw new Error("Invalid Asset Details")
        }
    }
    catch(error){
        next(error)
    }
}

export const returnAssignedAsset=async(req,res,next)=>{
    try{
       const {assetTag,returnedAt,returnedCondition,note}=req.body
       //check the asset
       const isAsset=await Asset.findOne({assetTag})
       if(isAsset?.status=="assigned"){
         await AssignedAssets.updateOne({assetId:isAsset._id,returnedAt:null},{$set:{returnedAt,returnedCondition,note}})
      
        //modify the assignedasset
          isAsset.status="available"
       await isAsset.save()
       return res.status(200).send({message:"Asset returned successfully"})
       }
       
       else{
        throw new Error("Invalid Asset details")
       }
    }
    catch(error){
        next(error)
    }
}