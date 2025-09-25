const jwt = require("jsonwebtoken"); // Module JWT pour création et vérification de tokens
const { User } = require("../models"); // Modèle User pour vérifier l'état du compte
require("dotenv").config(); // Charge les variables d'environnement depuis .env

/**
 * Middleware d'authentification avec vérification du rôle et activation du compte
 * @param {Array} roles - Liste des rôles autorisés (ex: ["admin"])
 *                        Si vide, tout utilisateur authentifié peut passer
 */
function authMiddleware(roles = []) {
  return async (req, res, next) => {
    try {
      // 1️⃣ Récupération du token depuis le header Authorization
      // Format attendu: "Bearer <token>"
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1];

      // 2️⃣ Si aucun token fourni => accès refusé
      if (!token) {
        return res.status(401).json({ message: "Token manquant" });
      }

      // 3️⃣ Vérification du token
      jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(403).json({ message: "Token invalide ou expiré" });

        // 4️⃣ Vérification que l'utilisateur existe en base
        const user = await User.findByPk(decoded.id);
        if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

        // 5️⃣ Vérification que le compte est activé (mot de passe défini)
        if (!user.password) {
          return res.status(403).json({ message: "Compte non activé, définissez un mot de passe." });
        }

        // 6️⃣ Vérification du rôle si roles spécifié
        if (roles.length > 0 && !roles.includes(user.role.toLowerCase())) {
          return res.status(403).json({ message: "Accès interdit: rôle non autorisé" });
        }

        // 7️⃣ Tout est ok, on stocke l'utilisateur dans req.user pour usage ultérieur
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role.toLowerCase(),
          firstname: user.firstname,
          lastname: user.lastname
        };

        next(); // Passe au middleware ou à la route suivante
      });
    } catch (error) {
      console.error("Erreur middleware auth:", error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  };
}

/**
 * Middleware spécifique pour les admins uniquement
 */
function adminMiddleware(req, res, next) {
  return authMiddleware(["admin"])(req, res, next);
}

/**
 * Middleware pour les utilisateurs standards et admins
 */
function userMiddleware(req, res, next) {
  return authMiddleware(["user", "admin"])(req, res, next);
}

module.exports = {
  authMiddleware,
  adminMiddleware,
  userMiddleware
};