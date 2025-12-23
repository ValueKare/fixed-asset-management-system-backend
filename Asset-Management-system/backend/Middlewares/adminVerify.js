import { verifyToken } from "../Utils/jwt.js";
import Admin from "../Models/Admin.js";

export const adminVerify = async (req, res, next) => {
  try {
    const { token } = req.cookies || {};
    if (!token) return res.status(401).json({ error: "No token provided" });

    const { id } = verifyToken(token);

    // check the id is valid or not
    const isAdmin = await Admin.findById(id);
    if (isAdmin) {
      return next();
    }

    return res.status(403).json({ error: "Invalid admin credentials" });
  } catch (error) {
    next(error);
  }
};
