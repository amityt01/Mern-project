const { verifyToken } = require("../utils/authHelper");
const { hasRole, hasPermission } = require("../utils/roles");

/**
 * Middleware to verify JWT token and attach user payload to request
 */
const authMiddleware = function (req, res, next) {
  // Check authorization header (case-insensitive in express headers)
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ success: false, message: "Access denied. No token provided." });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }

  // Attach user payload (id, _id, name, email, role) to request object
  req.user = decoded;
  if (req.user && req.user.id && !req.user._id) {
    req.user._id = req.user.id;
  } else if (req.user && req.user._id && !req.user.id) {
    req.user.id = req.user._id;
  }

  if (!req.user.role) {
    req.user.role = "Educator";
  }

  next();
};

/**
 * Middleware to authorize access based on user role(s)
 * @param  {...string|string[]} allowedRoles 
 */
const authorizeRoles = (...allowedRoles) => {
  const rolesList = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Access denied. Authentication required." });
    }

    const userRole = req.user.role || "Educator";
    if (!hasRole(userRole, rolesList)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${userRole}' does not have permission to perform this action.`,
      });
    }

    next();
  };
};

/**
 * Middleware to authorize access based on user permission(s)
 * @param  {...string|string[]} requiredPermissions 
 */
const authorizePermissions = (...requiredPermissions) => {
  const permissionsList = requiredPermissions.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Access denied. Authentication required." });
    }

    const userRole = req.user.role || "Educator";
    const hasAccess = permissionsList.every((permission) => hasPermission(userRole, permission));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${userRole}' does not have required permissions.`,
      });
    }

    next();
  };
};

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.authorizeRoles = authorizeRoles;
module.exports.authorizePermissions = authorizePermissions;

