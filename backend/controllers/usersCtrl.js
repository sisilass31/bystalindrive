const { User } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const crypto = require("crypto");
const sendMail = require("../utils/sendMail"); // fonction Nodemailer
require("dotenv").config();

const saltRounds = 10;
const regexPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{12,}$/;

// ------------------ REGISTER ------------------
exports.register = async (req, res) => {
  let { lastname, firstname, email, password, role } = req.body;

  try {
    // Validation champs
    if (!lastname || !firstname || !email) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs." });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Email invalide." });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) return res.status(400).json({ message: "Cet email existe déjà." });

    // Générer mot de passe si non fourni
    if (!password) {
      const randomPart = crypto.randomBytes(6).toString("hex"); // 12 caractères hex
      password = randomPart + "A1a"; // Assure majuscule + minuscule + chiffre
    }

    // Validation mot de passe
    if (!regexPassword.test(password)) {
      return res.status(400).json({ message: "Mot de passe invalide." });
    }

    const hash = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: hash,
      role: role || "user"
    });

    // --- Envoi de l'email avec identifiants ---
    await sendMail(
      email,
      "Vos identifiants BystalinDrive",
      `Bonjour ${firstname} ${lastname},\nVotre compte a été créé.\nEmail: ${email}\nMot de passe: ${password}\nVeuillez changer votre mot de passe lors de votre première connexion.`,
      `
        <p>Bonjour ${firstname} ${lastname},</p>
        <p>Votre compte a été créé sur <strong>BystalinDrive</strong>.</p>
        <p><strong>Email :</strong> ${email}<br>
           <strong>Mot de passe :</strong> ${password}</p>
        <p>Veuillez changer votre mot de passe lors de votre première connexion.</p>
      `
    );

    // Renvoie toutes les données côté front
    return res.status(201).json({
      id: newUser.id,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      role: newUser.role
    });

  } catch (error) {
    console.error("Erreur register :", error);
    return res.status(500).json({ message: "Erreur serveur lors de l'enregistrement." });
  }
};

// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Utilisateur non trouvé." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Mot de passe incorrect." });

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
      ? "/pages/admin/users-dashboard.html"
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
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });
    return res.json(user);
  } catch (error) {
    console.error("Erreur getMe :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

// ------------------ GET ALL USERS ------------------
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "firstname", "lastname", "email", "role"]
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
      return res.status(403).json({ message: "Accès interdit." });
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
    const { lastname, firstname, email, role } = req.body;

    if (req.user.id != id && req.user.role.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Accès interdit." });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    await user.update({
      lastname: lastname || user.lastname,
      firstname: firstname || user.firstname,
      email: email || user.email,
      role: role || user.role
    });

    res.status(200).json({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error("Erreur updateUser :", error);
    res.status(500).json({ message: "Erreur serveur lors de la modification." });
  }
};

// ------------------ UPDATE PASSWORD ------------------
exports.updatePassword = async (req, res) => {
  try {
    const id = req.params.id;
    const { oldPassword, newPassword } = req.body;

    if (req.user.id != id) return res.status(403).json({ message: "Accès interdit." });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    const validOld = await bcrypt.compare(oldPassword, user.password);
    if (!validOld) return res.status(400).json({ message: "Ancien mot de passe incorrect." });

    const regexPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{12,}$/;
    if (!regexPassword.test(newPassword)) return res.status(400).json({
      message: "Nouveau mot de passe invalide (12+ caractères, maj, min, chiffre)."
    });

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    return res.status(200).json({ message: "Mot de passe modifié avec succès." });
  } catch (error) {
    console.error("Erreur updatePassword :", error);
    return res.status(500).json({ message: "Erreur serveur lors du changement de mot de passe." });
  }
};


// ------------------ DELETE USER ------------------
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;

    if (req.user.id != id && req.user.role.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Accès interdit." });
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