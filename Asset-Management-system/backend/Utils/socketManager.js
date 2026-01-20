import { Server } from "socket.io";
import jwt from "jsonwebtoken";

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socket.id
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"]
      }
    });

    this.io.on("connection", (socket) => {
      console.log("🔌 User connected to socket:", socket.id);

      // Authenticate user with JWT token
      socket.on("authenticate", (token) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const userId = decoded.sub || decoded._id;
          
          // Store user connection
          this.connectedUsers.set(userId, socket.id);
          socket.userId = userId;
          
          console.log(`✅ User ${userId} authenticated and connected`);
          socket.emit("authenticated", { success: true, userId });
          
        } catch (error) {
          console.error("❌ Socket authentication failed:", error);
          socket.emit("authentication_error", { message: "Invalid token" });
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          console.log(`❌ User ${socket.userId} disconnected`);
        }
      });

      // Handle joining department rooms
      socket.on("join_department", (departmentId) => {
        if (socket.userId) {
          socket.join(`department_${departmentId}`);
          console.log(`📢 User ${socket.userId} joined department room: ${departmentId}`);
        }
      });

      // Handle leaving department rooms
      socket.on("leave_department", (departmentId) => {
        if (socket.userId) {
          socket.leave(`department_${departmentId}`);
          console.log(`📤 User ${socket.userId} left department room: ${departmentId}`);
        }
      });
    });

    console.log("🔌 Socket.IO server initialized");
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      console.log(`📤 Sent ${event} to user ${userId}:`, data);
    } else {
      console.log(`⚠️ User ${userId} not connected`);
    }
  }

  // Send notification to all users in a department
  sendToDepartment(departmentId, event, data) {
    this.io.to(`department_${departmentId}`).emit(event, data);
    console.log(`📢 Sent ${event} to department ${departmentId}:`, data);
  }

  // Send notification to all connected users
  broadcast(event, data) {
    this.io.emit(event, data);
    console.log(`📡 Broadcasted ${event}:`, data);
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }
}

export default new SocketManager();
