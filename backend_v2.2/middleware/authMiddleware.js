const jwt = require("jsonwebtoken");

// ======================= VERIFICAR TOKEN =======================
const verifyToken = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Token requerido" });

    const token = header.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"], // NO permitir tokens inseguros
      maxAge: "2h"
    });

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

// ======================= VERIFICAR ROL =======================
const verifyRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: "Permiso denegado" });
  next();
};

module.exports = { verifyToken, verifyRole };

