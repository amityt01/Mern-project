const { verifyToken } = require("../utils/authHelper");

module.exports = function (req, res, next) {
  // Check authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }

  // Attach token payload (userId, name, email) to request
  req.user = decoded;
  next();
};
