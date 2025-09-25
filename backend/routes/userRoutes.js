const express = require("express");
const router = express.Router();
const usersCtrl = require("../controllers/usersCtrl");

// Import des middlewares correctement
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// ------------------ REGISTER ------------------
router.post("/register", usersCtrl.register);

// ------------------ LOGIN ------------------
router.post("/login", usersCtrl.login);

// ------------------ GET ME (user connecté) ------------------
router.get("/me", authMiddleware(), usersCtrl.getMe);

// ------------------ GET ALL USERS (admin seulement) ------------------
router.get("/", authMiddleware(), adminMiddleware, usersCtrl.getAllUsers);

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

// ------------------ DELETE USER ------------------
router.delete("/:id", authMiddleware(), usersCtrl.deleteUser);

module.exports = router;