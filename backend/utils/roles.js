const ROLES = {
  ADMIN: "Admin",
  EDUCATOR: "Educator",
  STUDENT: "Student",
};

const PERMISSIONS = {
  RESOURCE_CREATE: [ROLES.ADMIN, ROLES.EDUCATOR],
  RESOURCE_READ: [ROLES.ADMIN, ROLES.EDUCATOR, ROLES.STUDENT],
  RESOURCE_UPDATE: [ROLES.ADMIN, ROLES.EDUCATOR],
  RESOURCE_DELETE: [ROLES.ADMIN, ROLES.EDUCATOR],
  FOLDER_CREATE: [ROLES.ADMIN, ROLES.EDUCATOR],
  STUDENT_MANAGE: [ROLES.ADMIN, ROLES.EDUCATOR],
  ADMIN_ACCESS: [ROLES.ADMIN],
};

/**
 * Check if a given user role matches any of the allowed roles (case-insensitive).
 * @param {string} userRole 
 * @param {string|string[]} allowedRoles 
 * @returns {boolean}
 */
function hasRole(userRole, allowedRoles) {
  if (!userRole || !allowedRoles) return false;
  const rolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const normalizedUserRole = userRole.toLowerCase();
  return rolesList.some((role) => typeof role === "string" && role.toLowerCase() === normalizedUserRole);
}

/**
 * Check if a given user role has a specific permission.
 * @param {string} userRole 
 * @param {string} permission 
 * @returns {boolean}
 */
function hasPermission(userRole, permission) {
  if (!userRole || !permission) return false;
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return hasRole(userRole, allowedRoles);
}

module.exports = {
  ROLES,
  PERMISSIONS,
  hasRole,
  hasPermission,
};

