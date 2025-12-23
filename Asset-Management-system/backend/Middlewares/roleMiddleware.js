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
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
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
