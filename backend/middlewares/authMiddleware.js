const jwt = require("jsonwebtoken"); // Import du module JWT pour la création et vérification des tokens
require("dotenv").config(); // Charge les variables d'environnement depuis le fichier .env

/**
 * Middleware d'authentification avec gestion des rôles
 * @param {Array} roles - liste des rôles autorisés (ex: ["admin"])
 *                     - si vide, tout utilisateur authentifié peut passer
 *
 * Fonction principale qui vérifie si la requête contient un JWT valide et
 * éventuellement si l'utilisateur a un rôle autorisé.
 */
function authMiddleware(roles = []) {
  return (req, res, next) => {
    try {
      // Récupération du token depuis le header Authorization
      // Format attendu: "Bearer <token>"
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      // Si pas de token présent => accès refusé
      if (!token) {
        return res.status(401).json({ message: "Token manquant" });
      }

      // Vérification du token avec la clé secrète
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Token invalide" });

        // Stocker les informations du token dans req.user pour usage ultérieur
        req.user = user;

        // Vérification du rôle si roles spécifié
        if (roles.length > 0 && !roles.includes(user.role)) {
          return res.status(403).json({ message: "Accès interdit: rôle non autorisé" });
        }

        // Si tout est ok, passe au middleware suivant ou à la route
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
 * Appelle authMiddleware en forçant le rôle "admin"
 */
function adminMiddleware(req, res, next) {
  return authMiddleware(["admin"])(req, res, next);
}

/**
 * Middleware spécifique pour les utilisateurs
 * Autorise les rôles "user" et "admin"
 */
function userMiddleware(req, res, next) {
  return authMiddleware(["user", "admin"])(req, res, next);
}

// Export des middlewares pour utilisation dans les routes
module.exports = {
  authMiddleware,
  adminMiddleware,
  userMiddleware
};