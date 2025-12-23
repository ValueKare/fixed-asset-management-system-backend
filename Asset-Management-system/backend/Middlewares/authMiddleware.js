// backend/Middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import Admin from "../Models/Admin.js";
import Employee from "../Models/Employee.js";

export const authMiddleware = async (req, res, next) => {
  try {
    let token;
    // prefer Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ message: "No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // find user in Admin or Employee collections - change according to your schema
    let user = await Employee.findById(decoded.id);
    if (!user) user = await Admin.findById(decoded.id);

    if (!user) return res.status(401).json({ message: "User not found" });

    // attach user object
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const protect = authMiddleware;
