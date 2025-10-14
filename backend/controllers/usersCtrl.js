const { User, Post } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const Yup = require("yup");
require("dotenv").config();

const saltRounds = 10;
const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000'
  : 'https://bystalindrive.netlify.app';

// ------------------ UTILITAIRE NETTOYAGE XSS ------------------
// Supprime tous les tags HTML pour éviter les attaques XSS
const clean = (str) => str.replace(/<[^>]*>/g, '');

// ------------------ SCHÉMAS DE VALIDATION YUP ------------------
// Validation des champs pour l'inscription
const registerSchema = Yup.object({
  firstname: Yup.string()
    // Supprime les espaces inutiles
    .trim()
    .required("Le prénom est obligatoire")
    .min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastname: Yup.string()
    .trim()
    .required("Le nom est obligatoire")
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  email: Yup.string()
    // Vérifie le format email
    .email("Email invalide")
    .required("L’email est obligatoire"),
  // Valeur autorisée
  role: Yup.string().oneOf(["admin", "client"], "Rôle invalide").default("client"),
});

// Validation du mot de passe
const passwordSchema = Yup.string()
  .min(12, "12 caractères minimum")
  .matches(/[a-z]/, "Doit contenir une minuscule")
  .matches(/[A-Z]/, "Doit contenir une majuscule")
  .matches(/\d/, "Doit contenir un chiffre")
  .required("Mot de passe requis");

// Validation des champs pour la connexion
const loginSchema = Yup.object({
  email: Yup.string().email("Email invalide").required("Email requis"),
  password: Yup.string().required("Mot de passe requis"),
});

// ------------------ REGISTER ------------------
exports.register = async (req, res) => {
  try {
    const validatedData = await registerSchema.validate(req.body, { abortEarly: false });
    const { firstname, lastname, email, role } = validatedData;

    const userExists = await User.findOne({ where: { email: clean(email) } });
    if (userExists) return res.status(400).json({ message: "Cet email existe déjà." });

    const newUser = await User.create({
      firstname: clean(firstname),
      lastname: clean(lastname),
      email: clean(email),
      password: null,
      role: role || "client"
    });

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const link = `${BASE_URL}/pages/set-password.html?token=${token}`;

    try {
      await sendMail(
        newUser.email,
        "Activez votre compte - Auto-école By Stalindrive",
        `Bonjour ${newUser.firstname} ${newUser.lastname}, définissez votre mot de passe ici: ${link}`,
        `
        <div style="width:100%;background-color:#eaeaea;padding:20px;font-family:Arial,sans-serif;">
          <div style="max-width:600px;margin:0 auto;background:#fff;padding:20px;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.2);color:#111;">
            <div style="margin-bottom:20px;">
              <img src="https://raw.githubusercontent.com/sisilass31/cda-project/main/frontend/assets/images/bystalindrive.png" style="width:180px;">
            </div>
            <p>Bonjour <strong>${newUser.firstname} ${newUser.lastname}</strong>,</p>
            <p>Votre compte a été créé. Pour l’activer, définissez votre mot de passe :</p>
            <a href="${link}" style="display:inline-block;padding:10px 20px;background:linear-gradient(90deg,#ef7f09,#e75617);color:#fff;text-decoration:none;border-radius:8px;">Activer mon compte</a>
            <p style="font-size:12px;color:#555;margin-top:20px">Ce lien est valide 1 heure.</p>
          </div>
        </div>`
      );
      console.log("Email envoyé ✅");
    } catch (err) {
      console.error("Erreur envoi mail :", err);
    }

    res.status(201).json({
      id: newUser.id,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      role: newUser.role,
      message: "Utilisateur créé. Un email d'activation a été envoyé."
    });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.errors });
    console.error("Erreur register :", err);
    res.status(500).json({ message: "Erreur serveur lors de l'enregistrement." });
  }
};

// ------------------ SET PASSWORD ------------------
exports.setPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    await passwordSchema.validate(password);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    if (user.password) return res.status(400).json({ message: "Mot de passe déjà défini." });

    user.password = await bcrypt.hash(password, saltRounds);
    await user.save();

    res.json({ message: "Mot de passe défini avec succès. Vous pouvez maintenant vous connecter." });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.errors });
    console.error("Erreur setPassword :", err);
    res.status(400).json({ message: "Lien invalide ou expiré." });
  }
};

// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = await loginSchema.validate(req.body, { abortEarly: false });

    const user = await User.findOne({ where: { email: clean(email) } });
    if (!user) return res.status(401).json({ message: "Utilisateur non trouvé." });
    if (!user.password) return res.status(403).json({ message: "Mot de passe non défini." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Mot de passe incorrect." });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, firstname: user.firstname, lastname: user.lastname },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const redirect =
      user.role.toLowerCase() === "admin"
        ? "/pages/admin/dashboard.html"
        : "/pages/client/espace-client.html";

    res.status(200).json({ token, redirect });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.errors });
    console.error("Erreur login :", err);
    res.status(500).json({ message: "Erreur serveur lors de la connexion." });
  }
};

// ------------------ GET ME ------------------
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "firstname", "lastname", "email", "role", "createdAt"]
    });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });
    res.json(user);
  } catch (err) {
    console.error("Erreur getMe :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ------------------ GET ALL USERS ------------------
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { is_deleted: false },
      attributes: ["id", "firstname", "lastname", "email", "role"],
      order: [["created_at", "ASC"]]
    });
    res.json(users);
  } catch (err) {
    console.error("Erreur getAllUsers :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ------------------ GET ONE USER ------------------
exports.getOneUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (req.user.id != id && req.user.role.toLowerCase() !== "admin")
      return res.status(403).json({ message: "Accès interdit." });

    const user = await User.findByPk(id, {
      attributes: ["id", "firstname", "lastname", "email", "role"]
    });
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    res.json(user);
  } catch (err) {
    console.error("Erreur getOneUser :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ------------------ UPDATE USER ------------------
exports.updateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const { lastname, firstname, email, role } = req.body;

    // Vérif : seul l'utilisateur lui-même ou un admin peut modifier
    if (req.user.id != id && req.user.role.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Accès interdit." });
    }

    // Récupération de l'utilisateur
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // Vérification de l'unicité de l'email (en ignorant les comptes supprimés)
    if (email && email !== user.email) {
      const existing = await User.findOne({
        where: { email: clean(email), is_deleted: false },
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Cet email est déjà utilisé par un autre utilisateur actif." });
      }
    }

    // Mise à jour avec nettoyage des champs
    await user.update({
      lastname: lastname ? clean(lastname) : user.lastname,
      firstname: firstname ? clean(firstname) : user.firstname,
      email: email ? clean(email) : user.email,
      role: role || user.role,
    });

    res.status(200).json({
      id: user.id,
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      message: "Utilisateur mis à jour avec succès.",
    });
  } catch (err) {
    console.error("Erreur updateUser :", err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }
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

    await passwordSchema.validate(newPassword);

    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    res.status(200).json({ message: "Mot de passe modifié avec succès." });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.errors });
    console.error("Erreur updatePassword :", err);
    res.status(500).json({ message: "Erreur serveur lors du changement de mot de passe." });
  }
};

// ------------------ DELETE USER ------------------
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (req.user.id != id && req.user.role.toLowerCase() !== "admin")
      return res.status(403).json({ message: "Accès interdit." });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    await user.update({ is_deleted: true });
    await Post.update({ is_deleted: true }, { where: { id_client: user.id } });

    res.status(200).json({ message: "Utilisateur et ses posts archivés." });
  } catch (err) {
    console.error("Erreur deleteUser :", err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." });
  }
};

// ------------------ FORGOT PASSWORD ------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    await Yup.string().email("Email invalide").required("Email requis").validate(email);

    const user = await User.findOne({ where: { email: clean(email) } });
    if (!user) return res.json({ message: "Si ce compte existe, un email a été envoyé." });

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const resetUrl = `${BASE_URL}/pages/reset-password.html?token=${resetToken}`;

    await sendMail(
      user.email,
      "Réinitialisation de votre mot de passe - Auto-école By Stalindrive",
      `Réinitialisez votre mot de passe ici : ${resetUrl}`,
      `
      <div style="width:100%;background:#eaeaea;padding:20px;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#fff;padding:20px;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.2); color:#111;">
          <img src="https://raw.githubusercontent.com/sisilass31/cda-project/main/frontend/assets/images/bystalindrive.png" style="width:180px;">
          <p>Réinitialisez votre mot de passe :</p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:linear-gradient(90deg,#ef7f09,#e75617);color:#fff;text-decoration:none;border-radius:8px;">Réinitialiser</a>
        </div>
      </div>`
    );

    res.json({ message: "Si ce compte existe, un email a été envoyé." });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.errors });
    console.error(err);
    res.status(500).json({ message: "Erreur serveur, réessayez plus tard." });
  }
};

// ------------------ RESET PASSWORD ------------------
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    await passwordSchema.validate(newPassword);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    res.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (err) {
    if (err.name === "ValidationError") return res.status(400).json({ message: err.errors });
    res.status(400).json({ message: "Token invalide ou expiré." });
  }
};
