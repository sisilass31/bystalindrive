const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Middleware d'authentification avec gestion des rôles
 * @param {Array} roles - liste des rôles autorisés (ex: ["admin"])
 *                     - si vide, tout utilisateur authentifié peut passer
 */
function authMiddleware(roles = []) {
  return (req, res, next) => {
    try {
      // Récupération du token depuis le header
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

      if (!token) {
        return res.status(401).json({ message: "Token manquant" });
      }

      // Vérification du token
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token invalide" });

        // Stocker les infos du token dans req.user
        req.user = user;

        // Vérifier le rôle si nécessaire
        if (roles.length > 0 && !roles.includes(user.role)) {
          return res.status(403).json({ message: "Accès interdit: rôle non autorisé" });
        }

        next();
      });
    } catch (error) {
      console.error("Erreur middleware auth:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  };
}

/**
 * Middleware spécifique pour les admins
 */
function adminMiddleware(req, res, next) {
  return authMiddleware(["admin"])(req, res, next);
}

/**
 * Middleware spécifique pour les utilisateurs
 */
function userMiddleware(req, res, next) {
  return authMiddleware(["user", "admin"])(req, res, next);
}

module.exports = {
  authMiddleware,
  adminMiddleware,
  userMiddleware
};