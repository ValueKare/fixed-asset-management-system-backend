import jwt from "jsonwebtoken"
import { config } from "dotenv"
config()
const SecretKey=process.env.JWT_SECRET || "My secret key"
 export const generateToken=(payload,expireTime="7d")=>{
   try{
    return jwt.sign(payload,SecretKey,{expiresIn:expireTime})
   }
   catch(error){
    throw error
   }
}
export const verifyToken =(token)=>{
try{
     return jwt.verify(token,SecretKey)
}
catch(error){
    throw error
}
}