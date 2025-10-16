function blockIfAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Déjà connecté." });
  }
  next();
}

module.exports = blockIfAuthenticated;
