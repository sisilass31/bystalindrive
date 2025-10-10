const express = require("express");
const router = express.Router();
const usersCtrl = require("../controllers/usersCtrl");
const csrfProtection = require('csurf')({ cookie: true });

// Import des middlewares
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");


// Route pour récupérer le token CSRF
router.get("/csrf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// ------------------ REGISTER ------------------
router.post("/register", authMiddleware(), csrfProtection, usersCtrl.register);

// ------------------ LOGIN ------------------
router.post("/login", usersCtrl.login);

// ------------------ GET ME (user connecté) ------------------
router.get("/me", authMiddleware(), usersCtrl.getMe);

// ------------------ GET ALL USERS (admin seulement) ------------------
router.get("/", authMiddleware(), usersCtrl.getAllUsers);

// ------------------ GET ONE USER ------------------
router.get("/:id", authMiddleware(), usersCtrl.getOneUser);

// ------------------ UPDATE USER BY ADMIN ------------------
router.put("/:id", authMiddleware(), csrfProtection, usersCtrl.updateUser);

// ------------------ UPDATE PASSWORD USER ------------------
router.put("/:id/password", authMiddleware(), csrfProtection, usersCtrl.updatePassword);

// ------------------ FORGOT PASSWORD ------------------
router.post("/forgot-password", usersCtrl.forgotPassword);

// ------------------ RESET PASSWORD ------------------
router.post("/reset-password", csrfProtection, usersCtrl.resetPassword);

// ------------------ SET PASSWORD ------------------
router.post("/set-password", usersCtrl.setPassword);

// ------------------ DELETE USER ------------------
router.delete("/:id", authMiddleware(), csrfProtection, usersCtrl.deleteUser);

module.exports = router;