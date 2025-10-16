const express = require("express");
const router = express.Router();
const usersCtrl = require("../controllers/usersCtrl");

// Import des middlewares
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// ------------------ ROUTE CSRF TOKEN ------------------
// Même remarque : CSRF déjà appliqué globalement depuis app.js
router.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// ------------------ REGISTER ------------------
router.post("/register", authMiddleware(), usersCtrl.register);

// ------------------ LOGIN ------------------
router.post("/login", usersCtrl.login);

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
router.post("/forgot-password", usersCtrl.forgotPassword);

// ------------------ RESET PASSWORD ------------------
router.post("/reset-password", usersCtrl.resetPassword);

// ------------------ SET PASSWORD ------------------
router.post("/set-password", usersCtrl.setPassword);

// ------------------ DELETE USER ------------------
router.delete("/:id", authMiddleware(), usersCtrl.deleteUser);

module.exports = router;