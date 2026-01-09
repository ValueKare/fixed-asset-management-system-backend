import nodemailer from "nodemailer"
import { config } from "dotenv"
config()
const transporter=nodemailer.createTransport({
    service:"gmail",
    port: 587,
    secure: false,
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
   return { success: true, message: "Email sent successfully" };
  }
  catch(error){
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

// Test email configuration
export const testEmailConfig=async()=>{
  try{
    console.log("Testing email configuration...");
    console.log("MAIL_USER:", process.env.MAIL_USER ? "✅ Set" : "❌ Not set");
    console.log("MAIL_PASS:", process.env.MAIL_PASS ? "✅ Set" : "❌ Not set");
    
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      return { success: false, error: "MAIL_USER or MAIL_PASS not set in environment variables" };
    }

    // Test by verifying transporter
    await transporter.verify();
    console.log("✅ SMTP connection successful");
    
    // Test sending a test email
    const testResult = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER, // Send to self for testing
      subject: "🧪 Email Configuration Test",
      text: "This is a test email to verify your Gmail configuration is working correctly.\n\nIf you receive this, your email setup is successful! 🎉"
    });
    
    console.log("✅ Test email sent successfully");
    console.log("Message ID:", testResult.messageId);
    
    return { 
      success: true, 
      message: "Email configuration is working! Test email sent to " + process.env.MAIL_USER,
      messageId: testResult.messageId
    };
  }
  catch(error){
    console.error("❌ Email configuration test failed:", error);
    return { success: false, error: error.message };
  }
}