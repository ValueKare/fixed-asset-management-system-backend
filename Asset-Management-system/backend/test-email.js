import { testEmailConfig } from "./Utils/nodemailer.js";

// Test your email configuration
console.log("🧪 Testing Gmail Configuration...\n");

testEmailConfig()
  .then(result => {
    if (result.success) {
      console.log("✅ SUCCESS:", result.message);
      if (result.messageId) {
        console.log("📧 Message ID:", result.messageId);
      }
    } else {
      console.log("❌ FAILED:", result.error);
      console.log("\n🔧 Troubleshooting Tips:");
      console.log("1. Make sure you're using a Gmail App Password (not regular password)");
      console.log("2. Enable 2-Step Verification on your Gmail account");
      console.log("3. Generate App Password from: https://myaccount.google.com/apppasswords");
      console.log("4. Check that .env file contains correct MAIL_USER and MAIL_PASS");
      console.log("5. Ensure no spaces or special characters in your .env file");
    }
  })
  .catch(error => {
    console.error("💥 Unexpected error:", error);
  });
