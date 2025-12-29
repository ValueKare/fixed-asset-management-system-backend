// backend/Middlewares/authMiddleware.js

import jwt from "jsonwebtoken";
import Role from "../Models/Role.js";
import Admin from "../Models/Admin.js";
import Employee from "../Models/Employee.js";

export const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Extract token
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication token missing" });
    }

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /*
      Expected decoded payload:
      {
        sub,
        roleId,
        userType,
        organizationId,
        hospitalId
      }
    */

    // 3️⃣ Load role & permissions (RBAC core)
    const role = await Role.findById(decoded.roleId);
    if (!role) {
      return res.status(401).json({ message: "Invalid role" });
    }

    // 4️⃣ Load minimal user (optional but recommended)
    let user = null;

    if (decoded.userType === "admin") {
      user = await Admin.findById(decoded.sub).select("_id email organizationId hospitalId");
    } else {
      user = await Employee.findById(decoded.sub).select("_id name organizationId hospital");
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // 5️⃣ Attach request context (IMPORTANT)
    req.auth = {
      userId: decoded.sub,
      userType: decoded.userType,
      role: role.name,
      roleId: role._id,
      permissions: role.permissions,
      organizationId: decoded.organizationId,
      hospitalId: decoded.hospitalId || null
    };

    // Optional: attach user profile if needed
    req.user = user;

    next();
  } catch (err) {
    console.error("AuthMiddleware error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


export const protect = authMiddleware;
