const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/userCtrl");

// Import des middlewares correctement
const { authMiddleware, adminMiddleware } = require("../middlewares/authMiddleware");

// ------------------ REGISTER ------------------
router.post("/register", userCtrl.register);

// ------------------ LOGIN ------------------
router.post("/login", userCtrl.login);

// ------------------ GET ME (user connecté) ------------------
router.get("/me", authMiddleware(), userCtrl.getMe);

// ------------------ GET ALL USERS (admin seulement) ------------------
router.get("/", authMiddleware(), adminMiddleware, userCtrl.getAllUsers);

// ------------------ GET ONE USER ------------------
router.get("/:id", authMiddleware(), userCtrl.getOneUser);

// ------------------ UPDATE USER ------------------
router.put("/:id", authMiddleware(), userCtrl.updateUser);

// ------------------ DELETE USER ------------------
router.delete("/:id", authMiddleware(), userCtrl.deleteUser);

module.exports = router;