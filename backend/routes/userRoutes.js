const express = require("express");
const router = express.Router();
const usersCtrl = require("../controllers/usersCtrl");
const blockIfAuthenticated = require("../middlewares/blockIfAuthenticated");

// Import des middlewares
const { authMiddleware } = require("../middlewares/authMiddleware");

// ------------------ REGISTER ------------------
router.post("/register", authMiddleware(), usersCtrl.register);

// --- ROUTE SPÉCIALE TEST (bypass auth pour /register) ---
if (process.env.NODE_ENV === "test") {
  router.post("/register-test", usersCtrl.register);
}

// ------------------ LOGIN ------------------
router.post("/login", blockIfAuthenticated, usersCtrl.login);

// ------------------ GET ME (user connecté) ------------------
router.get("/me", authMiddleware(), usersCtrl.getMe);

// ------------------ GET ALL USERS (admin seulement) ------------------
router.get("/", authMiddleware(), usersCtrl.getAllUsers);

// ------------------ GET ONE USER ------------------
router.get("/:id", authMiddleware(), usersCtrl.getOneUser);

// ------------------ UPDATE USER BY ADMIN ------------------
router.put("/:id", authMiddleware(), usersCtrl.updateUser);

// ------------------ UPDATE PASSWORD USER ------------------
router.put("/:id/password", authMiddleware(), usersCtrl.updatePassword);

// ------------------ FORGOT PASSWORD ------------------
router.post("/forgot-password", blockIfAuthenticated, usersCtrl.forgotPassword);

// ------------------ RESET PASSWORD ------------------
router.post("/reset-password", blockIfAuthenticated, usersCtrl.resetPassword);

// ------------------ SET PASSWORD ------------------
router.post("/set-password", blockIfAuthenticated, usersCtrl.setPassword);

// ------------------ DELETE USER ------------------
router.delete("/:id", authMiddleware(), usersCtrl.deleteUser);

// ------------------ CHECK TOKEN ------------------
router.post("/check-token", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: "Token manquant." });

  try {
    const decoded = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);
    const { User } = require("../models"); // modèle User

    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    if (user.password) return res.status(400).json({ message: "Mot de passe déjà défini." });

    res.json({ message: "Token valide." });
  } catch (err) {
    res.status(400).json({ message: "Token invalide ou expiré." });
  }
});

module.exports = router;