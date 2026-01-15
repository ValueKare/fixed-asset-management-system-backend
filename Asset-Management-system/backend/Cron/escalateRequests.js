import cron from "node-cron";
import Request from "../Models/Request.js";
import { getNextEscalationLevel } from "../Utils/escalationFlow.js";

export const startRequestEscalationCron = () => {
  cron.schedule("*/15 * * * *", async () => {
    try {
      console.log("⏱ Running request escalation cron...");

      const now = new Date();

      const pendingRequests = await Request.find({
        finalStatus: "pending",
        "escalation.enabled": true,
        currentLevel: { $in: ["level1", "hod"] }
      });

      for (const request of pendingRequests) {
        const {
          escalateAfterHours,
          lastActionAt
        } = request.escalation;

        if (!lastActionAt || !escalateAfterHours) continue;

        const diffMs = now - new Date(lastActionAt);
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < escalateAfterHours) continue;

        const nextLevel = getNextEscalationLevel(request.currentLevel);

        if (!nextLevel) continue;

        console.log(
          `⬆ Escalating request ${request._id} from ${request.currentLevel} → ${nextLevel}` 
        );

        // Update approval flow
        request.approvalFlow[request.currentLevel] = {
          status: "skipped",
          date: new Date(),
          remarks: "Auto-escalated due to SLA breach"
        };

        request.currentLevel = nextLevel;
        request.escalation.lastActionAt = new Date();

        await request.save();
      }

      console.log("✅ Request escalation cron completed");
    } catch (err) {
      console.error("❌ Escalation cron error:", err);
    }
  });
};
