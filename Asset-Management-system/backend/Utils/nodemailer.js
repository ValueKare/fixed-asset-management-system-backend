import nodemailer from "nodemailer"
import { config } from "dotenv"
config()
const transporter=nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:process.env.MAIL_USER,
        pass:process.env.MAIL_PASS
    }
})

export const sendEmail=async({to,subject,text})=>{
  try{
   await transporter.sendMail({
    from :process.env.MAIL_USER,
    to,
    subject,
    text
   })
  }
  catch(error){
    throw new Error(error)
  }
}