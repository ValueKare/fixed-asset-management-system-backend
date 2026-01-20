import express from "express";
import Notification from "../Models/Notification.js";
import { authMiddleware } from "../Middlewares/authMiddleware.js";

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for logged-in user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 notifications: [{ id: "notif_123", type: "asset_request", title: "Asset Transfer Request", ... }]
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    console.log("🔔 GET /api/notifications - START");
    console.log("  User ID:", req.user._id);
    console.log("  User Sub:", req.user.sub);
    console.log("  User Object:", req.user);
    
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;
    
    console.log("  Query params:", { page, limit, unreadOnly, skip });

    // Build query - get notifications where current user is recipient
    const query = {
      "to.id": req.user._id.toString() || req.user.sub
    };

    console.log("  Query:", JSON.stringify(query, null, 2));

    if (unreadOnly === 'true') {
      query.read = false;
      console.log("  Added read filter: false");
    }

    console.log("  Executing find query...");
    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log("  Found notifications:", notifications.length);
    console.log("  Notification details:", notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      to: n.to,
      from: n.from,
      read: n.read,
      timestamp: n.timestamp
    })));

    const total = await Notification.countDocuments(query);
    console.log("  Total notifications count:", total);

    console.log("🔔 GET /api/notifications - SUCCESS");
    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error("❌ Get notifications error:", error);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications"
    });
  }
});

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.put("/:notificationId/read", authMiddleware, async (req, res) => {
  try {
    console.log("📖 PUT /api/notifications/:notificationId/read - START");
    console.log("  Notification ID:", req.params.notificationId);
    console.log("  User ID:", req.user._id);
    
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { 
        id: notificationId,
        "to.id": req.user._id.toString() || req.user.sub
      },
      { read: true },
      { new: true }
    );

    if (!notification) {
      console.log("❌ Notification not found");
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    console.log("✅ Notification marked as read");
    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    console.error("❌ Mark notification read error:", error);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read"
    });
  }
});

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read for user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    console.log("📖 PUT /api/notifications/read-all - START");
    console.log("  User ID:", req.user._id);
    
    const result = await Notification.updateMany(
      { 
        "to.id": req.user._id.toString() || req.user.sub,
        read: false
      },
      { read: true }
    );

    console.log(`✅ Marked ${result.modifiedCount} notifications as read`);
    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error("❌ Mark all notifications read error:", error);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read"
    });
  }
});

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get count of unread notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread notifications count
 */
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    console.log("🔢 GET /api/notifications/unread-count - START");
    console.log("  User ID:", req.user._id);
    console.log("  User Sub:", req.user.sub);
    console.log("  User Object:", req.user);

    const query = {
      "to.id": req.user._id.toString() || req.user.sub,
      read: false
    };

    console.log("  Query:", JSON.stringify(query, null, 2));
    console.log("  Executing count query...");

    const count = await Notification.countDocuments(query);
    
    console.log("  Unread count:", count);
    console.log("🔢 GET /api/notifications/unread-count - SUCCESS");

    res.status(200).json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error("❌ Get unread count error:", error);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count"
    });
  }
});

export default router;
