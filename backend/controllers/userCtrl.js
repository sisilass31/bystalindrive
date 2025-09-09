const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
require("dotenv").config();

const saltRounds = 10;
const regexPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{12,}$/;

// ------------------ REGISTER ------------------
exports.register = async (req, res) => {
  const { lastname, firstname, email, password } = req.body;

  try {
    if (!lastname || !firstname || !email || !password) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs." });
    }

    if (!regexPassword.test(password)) {
      return res.status(400).json({ message: "Mot de passe invalide." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Email invalide" });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) return res.status(400).json({ message: "Cet email existe déjà." });

    const hash = await bcrypt.hash(password, saltRounds);
    const newUser = await User.create({ firstname, lastname, email, password: hash, role: 'user' });

    return res.status(201).json({ message: "Utilisateur créé.", user: { id: newUser.id, email: newUser.email } });
  } catch (error) {
    console.error("Erreur register :", error);
    res.status(500).json({ message: "Erreur serveur lors de l'enregistrement." });
  }
};

// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Utilisateur non trouvé" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role.toLowerCase(),
        firstname: user.firstname,
        lastname: user.lastname
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const redirect = user.role.toLowerCase() === "admin"
      ? "/pages/admin/dashboard.html"
      : "/pages/client/espace-client.html";

    return res.status(200).json({ token, redirect });
  } catch (error) {
    console.error("Erreur login :", error);
    return res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
};

// ------------------ GET ME ------------------
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "firstname", "lastname", "email", "role", "createdAt"]
    });

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    return res.json(user);
  } catch (error) {
    console.error("Erreur getMe :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// ------------------ GET ALL USERS ------------------
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'firstname', 'lastname', 'email', 'role']
    });
    res.json(users);
  } catch (error) {
    console.error("Erreur getAllUsers :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ------------------ GET ONE USER ------------------
exports.getOneUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (req.user.id != id && req.user.role.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Accès interdit" });
    }

    const user = await User.findByPk(id, {
      attributes: ["id", "firstname", "lastname", "email", "role"]
    });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    res.json(user);
  } catch (error) {
    console.error("Erreur getOneUser :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ------------------ UPDATE USER ------------------
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { lastname, firstname, email } = req.body;

    if (req.user.id != id && req.user.role.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Accès interdit" });
    }

    if (!lastname && !firstname && !email) {
      return res.status(400).json({ message: "Aucune donnée fournie pour la modification." });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    await user.update({
      lastname: lastname || user.lastname,
      firstname: firstname || user.firstname,
      email: email || user.email
    });

    res.status(200).json({ message: "Modification effectuée." });
  } catch (error) {
    console.error("Erreur updateUser :", error);
    res.status(500).json({ message: "Erreur serveur lors de la modification." });
  }
};

// ------------------ DELETE USER ------------------
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;

    if (req.user.id != id && req.user.role.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Accès interdit" });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    await User.destroy({ where: { id } });
    res.status(200).json({ message: "Utilisateur supprimé." });
  } catch (error) {
    console.error("Erreur deleteUser :", error);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." });
  }
};