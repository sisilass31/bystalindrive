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
  let { lastname, firstname, email, role } = req.body;

  try {
    if (!lastname || !firstname || !email) {
      return res.status(400).json({ message: "Veuillez remplir tous les champs." });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Email invalide." });
    }

    const userExists = await User.findOne({ where: { email } });
    if (userExists) return res.status(400).json({ message: "Cet email existe déjà." });

    // Créer l'utilisateur sans mot de passe
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      password: null,
      role: role || "client"
    });

    // Générer un token d'activation
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const link = `http://localhost:3000/pages/set-password.html?token=${token}`;

    // Envoi email d’activation
    await sendMail(
      newUser.email,
      "Activez votre compte - Auto-école By Stalindrive",
      `Bonjour ${newUser.firstname} ${newUser.lastname}, définissez votre mot de passe ici: ${link}`,
      `
      <div style="width: 100%; background-color: #eaeaea; padding: 20px; font-family: Arial, sans-serif; box-sizing: border-box;">
        <div style="
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
          color: #111111;
          text-align: start;
          box-sizing: border-box;">
          
          <div style="text-align: start; margin-bottom: 20px;">
            <img src="https://raw.githubusercontent.com/sisilass31/cda-project/main/frontend/assets/images/bystalindrive.png" 
                alt="Logo By Stalindrive" 
                style="width: 180px; height: auto;">
          </div>

          <p>Bonjour <strong>${newUser.firstname} ${newUser.lastname}</strong>,</p>
          <p>Votre compte a été créé. Pour l’activer, définissez votre mot de passe :</p>
          <a href="${link}" style="display: inline-block; padding: 10px 20px; background: linear-gradient(90deg,#ef7f09,#e75617); text-decoration:none; color: #111111; border-radius:8px;">Activer mon compte</a>
          <p style="font-size:12px;color:#555;margin-top:20px">Ce lien est valide 1 heure.</p>
        </div>
      </div>`
    );

    res.status(201).json({
      id: newUser.id,
      firstname: newUser.firstname,
      lastname: newUser.lastname,
      email: newUser.email,
      role: newUser.role,
      message: "Utilisateur créé. Un email d'activation a été envoyé."
    });
  } catch (error) {
    console.error("Erreur register :", error);
    res.status(500).json({ message: "Erreur serveur lors de l'enregistrement." });
  }
};

// ------------------ SET PASSWORD ------------------
exports.setPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!regexPassword.test(password)) {
      return res.status(400).json({ message: "Mot de passe invalide (12+ caractères, majuscule, minuscule, chiffre)." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    if (user.password) {
      return res.status(400).json({ message: "Mot de passe déjà défini. Utilisez la connexion." });
    }

    user.password = await bcrypt.hash(password, saltRounds);
    await user.save();

    res.json({ message: "Mot de passe défini avec succès. Vous pouvez maintenant vous connecter." });
  } catch (err) {
    console.error("Erreur setPassword :", err);
    res.status(400).json({ message: "Lien invalide ou expiré." });
  }
};

// ------------------ LOGIN ------------------
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: "Utilisateur non trouvé." });

    if (!user.password) return res.status(403).json({ message: "Mot de passe non défini. Veuillez activer votre compte via le mail." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: "Mot de passe incorrect." });

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role.toLowerCase(),
      firstname: user.firstname,
      lastname: user.lastname
    }, process.env.JWT_SECRET, { expiresIn: "24h" });

    const redirect = user.role.toLowerCase() === "admin"
      ? "/pages/admin/dashboard.html"
      : "/pages/client/espace-client.html";

    res.status(200).json({ token, redirect });
  } catch (error) {
    console.error("Erreur login :", error);
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
  } catch (error) {
    console.error("Erreur getMe :", error);
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
  } catch (error) {
    console.error("Erreur getAllUsers :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

// ------------------ GET ONE USER ------------------
exports.getOneUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (req.user.id != id && req.user.role.toLowerCase() !== "admin") return res.status(403).json({ message: "Accès interdit." });

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

    if (req.user.id != id && req.user.role.toLowerCase() !== "admin") return res.status(403).json({ message: "Accès interdit." });

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

    if (!user.password) return res.status(403).json({ message: "Mot de passe non défini." });

    const validOld = await bcrypt.compare(oldPassword, user.password);
    if (!validOld) return res.status(400).json({ message: "Ancien mot de passe incorrect." });

    if (!regexPassword.test(newPassword)) return res.status(400).json({ message: "Nouveau mot de passe invalide (12+ caractères, maj, min, chiffre)." });

    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    res.status(200).json({ message: "Mot de passe modifié avec succès." });
  } catch (error) {
    console.error("Erreur updatePassword :", error);
    res.status(500).json({ message: "Erreur serveur lors du changement de mot de passe." });
  }
};

// ------------------ DELETE USER ------------------
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (req.user.id != id && req.user.role.toLowerCase() !== "admin") return res.status(403).json({ message: "Accès interdit." });

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    await user.update({ is_deleted: true });
    await Post.update({ is_deleted: true }, { where: { id_client: user.id } });

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
    const user = await User.findOne({ where: { email } });

    if (!user) return res.json({ message: "Si ce compte existe, un email de réinitialisation a été envoyé." });

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const resetUrl = `http://localhost:3000/pages/reset-password.html?token=${resetToken}`;

    await sendMail(
      user.email,
      "Réinitialisation de votre mot de passe - Auto-école By Stalindrive",
      `Réinitialisez votre mot de passe ici : ${resetUrl}`,
      `
      <div style="width:100%;background:#eaeaea;padding:20px;font-family:Arial,sans-serif;">
        <div style="max-width:600px;margin:0 auto;background:#fff;padding:20px;border-radius:10px;box-shadow:0 4px 10px rgba(0,0,0,0.2);">
          <div style="margin-bottom:20px;">
            <img src="https://raw.githubusercontent.com/sisilass31/cda-project/main/frontend/assets/images/bystalindrive.png" style="width:180px;">
          </div>
          <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:linear-gradient(90deg,#ef7f09,#e75617);color:#fff;text-decoration:none;border-radius:8px;">Réinitialiser</a>
          <p style="font-size:12px;color:#555;margin-top:10px;">Si vous n’avez pas demandé cette action, ignorez ce mail.</p>
        </div>
      </div>`
    );

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

    if (!regexPassword.test(newPassword)) {
      return res.status(400).json({ message: "Mot de passe invalide." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.status(404).json({ message: "Utilisateur introuvable" });

    user.password = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    res.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (err) {
    res.status(400).json({ message: "Token invalide ou expiré" });
  }
};