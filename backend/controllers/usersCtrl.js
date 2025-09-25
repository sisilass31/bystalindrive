const { User, Post } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
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
    // Validation email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Email invalide." });
    }

    // On cherche dans la BDD si l'utilisateur existe (via le mail)
    const userExists = await User.findOne({ where: { email } });
    // si oui → envoie le message
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

    // On hash le mdp
    const hash = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: hash,
      role: role || "client"
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
  // On récupère les données
  const { email, password } = req.body;
  try {
    // On recherche dans la BDD le mail
    const user = await User.findOne({ where: { email } });
    // si on trouve pas alors on return le message
    if (!user) return res.status(401).json({ message: "Utilisateur non trouvé." });

    // On vérifie le mot de passe en comparant grâce à bcrypt
    const validPassword = await bcrypt.compare(password, user.password);
    // Si ce n'est pas similaire alors on return le message
    if (!validPassword) return res.status(401).json({ message: "Mot de passe incorrect." });

    // Si le mail et le mdp sont bons alors on créer un json web token
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

    // Si c'est un admin on le redirige dans dashboard et si c'est un client - espace client
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
      // filtre sur les utilisateurs non archivés
      where: { is_deleted: false },
      // colonnes à retourner
      attributes: ["id", "firstname", "lastname", "email", "role"],
      order: [["created_at", "ASC"]]
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

    // Vérifie si l'utilisateur est admin ou supprime son propre compte
    if (req.user.id != id && req.user.role.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Accès interdit." });
    }

    // Récupère l'utilisateur
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    // Archive l'utilisateur
    await user.update({ is_deleted: true });

    // Archive tous ses posts où il est user
    await Post.update(
      { is_deleted: true },
      { where: { id_client: user.id } }
    );

    res.status(200).json({ message: "Utilisateur et ses posts archivés." });

  } catch (error) {
    console.error("Erreur deleteUser :", error);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." });
  }
};

// ------------------ FORGOT PASSWORD ------------------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Cherche l'utilisateur
    const user = await User.findOne({ where: { email } });

    // Ne pas révéler si l'utilisateur existe ou pas
    if (!user) {
      return res.json({ message: "Si ce compte existe, un email de réinitialisation a été envoyé." });
    }

    // Générer un token temporaire (valide 15min)
    const resetToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    // URL frontend de réinitialisation
    const resetUrl = `http://localhost:3000/pages/reset-password.html?token=${resetToken}`;


    // Config nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // TLS/STARTTLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Envoie du mail
    await transporter.sendMail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe - Auto-école By Stalindrive",
      html: `
    <div style="width: 100%; background-color: #eaeaeaff; padding: 20px; font-family: Arial, sans-serif; box-sizing: border-box;"">
      <div style="
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        text-align: start;
        box-sizing: border-box;">
        
        <!-- Logo -->
        <div style="text-align: start; margin-bottom: 20px;">
          <img src="https://raw.githubusercontent.com/sisilass31/cda-project/main/frontend/assets/images/bystalindrive.png" alt="Logo By Stalindrive" style="width: 180px; height: auto;">
        </div>

        <p style="font-size: 16px; color: #111111;">Vous avez demandé à réinitialiser votre mot de passe pour votre compte Auto-école By Stalindrive.</p>
        <p style="font-size: 16px; color: #111111;">Ce lien est <strong>valide 15 minutes</strong> :</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          text-align: center;
          line-height: 38px; /* même que la hauteur du bouton pour centrer verticalement */
          padding: 0 22px;
          background: linear-gradient(90deg, #ef7f09, #e75617);
          color: #111111;
          text-decoration: none;
          border-radius: 8px;
          height: 38px;
          white-space: nowrap;
        ">Réinitialiser mon mot de passe</a>
        <p style="font-size: 14px; color: #252525;">Si vous n’avez pas demandé cette action, vous pouvez ignorer ce mail.</p>
        <p style="font-size: 14px; color: #575757ff;">Merci, Équipe Auto-école By Stalindrive</p>
      </div>
    </div>
  `
    });


    res.json({ message: "Si ce compte existe, un email de réinitialisation a été envoyé." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur, réessayez plus tard.", error: err.message });
  }
};

// ------------------ RESET PASSWORD ------------------
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    // Hash du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Mot de passe mis à jour avec succès" });
  } catch (err) {
    res.status(400).json({ message: "Token invalide ou expiré" });
  }
};