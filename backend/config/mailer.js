// On importe nodemailer pour envoyer des emails
const nodemailer = require("nodemailer");

// On charge les variables d'environnement depuis le .env
require("dotenv").config();

// Création du transporteur d'emails avec la config SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // serveur SMTP (ex: smtp.gmail.com)
  port: process.env.SMTP_PORT,      // port SMTP (ex: 587 pour TLS)
  secure: false,                    // true si port 465 (SSL), false si 587 (TLS)
  auth: {
    user: process.env.SMTP_USER,    // adresse email qui envoie les mails
    pass: process.env.SMTP_PASS     // mot de passe d'application
  }
});

// On exporte le transporteur pour pouvoir envoyer des emails ailleurs
module.exports = transporter;