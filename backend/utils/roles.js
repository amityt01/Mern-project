const ROLES = {
  ADMIN: "Admin",
  EDUCATOR: "Educator",
  STUDENT: "Student",
};

const PERMISSIONS = {
  RESOURCE_CREATE: [ROLES.ADMIN, ROLES.EDUCATOR],
  RESOURCE_READ: [ROLES.ADMIN, ROLES.EDUCATOR, ROLES.STUDENT],
  FOLDER_CREATE: [ROLES.ADMIN, ROLES.EDUCATOR],
  STUDENT_MANAGE: [ROLES.ADMIN, ROLES.EDUCATOR],
  ADMIN_ACCESS: [ROLES.ADMIN],
};

/**
 * Check if a given user role matches any of the allowed roles (case-insensitive).
 * @param {string} userRole 
 * @param {string[]} allowedRoles 
 * @returns {boolean}
 */
function hasRole(userRole, allowedRoles) {
  if (!userRole || !allowedRoles || !Array.isArray(allowedRoles)) return false;
  const normalizedUserRole = userRole.toLowerCase();
  return allowedRoles.some((role) => role.toLowerCase() === normalizedUserRole);
}

module.exports = {
  ROLES,
  PERMISSIONS,
  hasRole,
};
