export const requirePermission = (module, action) => {
  return (req, res, next) => {
    // req.auth is set by authMiddleware
    if (!req.auth?.permissions?.[module]?.[action]) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions"
      });
    }
    next();
  };
};
export default requirePermission;