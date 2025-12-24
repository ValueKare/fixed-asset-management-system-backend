// backend/Middlewares/roleMiddleware.js
export const isEmployee = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role !== "employee") return res.status(403).json({ message: "Employee access only" });
  next();
};

export const isHOD = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role !== "hod") return res.status(403).json({ message: "HOD access only" });
  next();
};

export const isInventory = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role !== "inventory" && req.user.role !== "admin") {
    return res.status(403).json({ message: "Inventory access only" });
  }
  next();
};

export const isCFO = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role !== "cfo") return res.status(403).json({ message: "CFO access only" });
  next();
};

export const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access only" });
  next();
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Extract role from JWT token if not already in req.user
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Ensure req.user has role from JWT token
    const userRole = req.user.role;
    
    if (!userRole) {
      return res.status(401).json({ message: "Role not found in token" });
    }
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        message: "Access denied",
        required: roles,
        current: userRole
      });
    }
    next();
  };
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    if (req.user.role !== role) {
      return res.status(403).json({ message: `${role} access only` });
    }
    next();
  };
};
